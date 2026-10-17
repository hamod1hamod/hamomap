import { Node, Edge } from '@xyflow/react';
import { MindMap, NodeData } from '@/types/hamomap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface MindMapExportData {
  version: string;
  exportedAt: number;
  map: MindMap;
  nodes: Node[];
  edges: Edge[];
}

export class ExportService {
  /**
   * Export map, nodes, and edges to clean formatted JSON
   */
  public static exportToJSON(map: MindMap, nodes: Node[], edges: Edge[]): void {
    const exportData: MindMapExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      map,
      nodes,
      edges,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${this.sanitizeFilename(map.title)}.mindforge.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Export to Markdown hierarchical outline
   */
  public static exportToMarkdown(map: MindMap, nodes: Node[], edges: Edge[]): void {
    let md = `# ${map.title}\n\n`;
    if (map.description) md += `> ${map.description}\n\n`;

    // Map parent-children
    const childrenMap = new Map<string, string[]>();
    const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));
    const targetSet = new Set<string>();

    edges.forEach((e) => {
      targetSet.add(e.target);
      if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
      childrenMap.get(e.source)!.push(e.target);
    });

    const rootNodes = nodes.filter((n) => !targetSet.has(n.id) || (n.data as NodeData).isRoot);
    const rootsToTraverse = rootNodes.length > 0 ? rootNodes : [nodes[0]];

    const visited = new Set<string>();

    const writeNode = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) return;
      const data = node.data as NodeData;
      const indent = '  '.repeat(depth);

      md += `${indent}- **${data.label || 'Untitled'}**`;
      if (data.difficulty) md += ` \`[${data.difficulty}]\``;
      if (data.tags && data.tags.length > 0) md += ` (${data.tags.map((t) => `#${t}`).join(' ')})`;
      md += '\n';

      if (data.description) {
        md += `${indent}  ${data.description}\n`;
      }
      if (data.notes) {
        md += `${indent}  *Notes:* ${data.notes}\n`;
      }

      const children = childrenMap.get(nodeId) || [];
      children.forEach((cId) => writeNode(cId, depth + 1));
    };

    rootsToTraverse.forEach((r) => writeNode(r.id, 0));

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeFilename(map.title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Export to CSV table
   */
  public static exportToCSV(map: MindMap, nodes: Node[], edges: Edge[]): void {
    const parentMap = new Map<string, string>();
    edges.forEach((e) => parentMap.set(e.target, e.source));

    const headers = ['Node ID', 'Title', 'Description', 'Category', 'Difficulty', 'Priority', 'Tags', 'Parent ID'];
    const rows = nodes.map((n) => {
      const d = n.data as NodeData;
      const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escape(n.id),
        escape(d.label),
        escape(d.description),
        escape(d.category),
        escape(d.difficulty),
        escape(d.priority),
        escape(d.tags?.join(', ')),
        escape(parentMap.get(n.id) || ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeFilename(map.title)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Export Canvas element to high-res PNG image
   */
  public static async exportToPNG(containerEl: HTMLElement, title: string): Promise<void> {
    try {
      const canvas = await html2canvas(containerEl, {
        backgroundColor: '#0f172a', // Clean dark slate background
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${this.sanitizeFilename(title)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to generate PNG image.');
    }
  }

  /**
   * Export Canvas to PDF Document
   */
  public static async exportToPDF(containerEl: HTMLElement, title: string): Promise<void> {
    try {
      const canvas = await html2canvas(containerEl, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${this.sanitizeFilename(title)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF document.');
    }
  }

  /**
   * Parses and validates uploaded JSON mind map file
   */
  public static parseImportJSON(fileContent: string): MindMapExportData {
    const parsed = JSON.parse(fileContent);
    if (!parsed || !parsed.map || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Invalid MindForge file format. Missing map, nodes, or edges array.');
    }
    return parsed;
  }

  private static sanitizeFilename(str: string): string {
    return (str || 'mindmap').replace(/[^a-z0-9_\u0600-\u06FF-]/gi, '_').toLowerCase();
  }
}
