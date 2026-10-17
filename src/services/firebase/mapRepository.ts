import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { MindMap, NodeData, Flashcard, StudySession, ReviewEvent } from '@/types/hamomap';
import { Node, Edge } from '@xyflow/react';

const LOCAL_STORAGE_MAPS_KEY = 'hamomap_local_maps';
const LOCAL_STORAGE_NODES_PREFIX = 'hamomap_nodes_';
const LOCAL_STORAGE_EDGES_PREFIX = 'hamomap_edges_';
const LOCAL_STORAGE_FLASHCARDS_KEY = 'hamomap_flashcards';
const LOCAL_STORAGE_SESSIONS_KEY = 'hamomap_sessions';

export class MapRepository {
  /**
   * Get all mind maps for a user
   */
  public static async getUserMaps(userId: string): Promise<MindMap[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'mindMaps'),
          where('ownerId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MindMap));
      } catch (err) {
        console.warn('Firestore query failed, using local storage cache:', err);
      }
    }

    // Local fallback
    const raw = localStorage.getItem(LOCAL_STORAGE_MAPS_KEY);
    if (!raw) return this.getStarterMaps(userId);
    try {
      const maps: MindMap[] = JSON.parse(raw);
      return maps.filter((m) => m.ownerId === userId || m.isPublic);
    } catch {
      return this.getStarterMaps(userId);
    }
  }

  /**
   * Get a single mind map by ID
   */
  public static async getMapById(
    mapId: string
  ): Promise<{ map: MindMap; nodes: Node[]; edges: Edge[] } | null> {
    if (isFirebaseConfigured && db) {
      try {
        const mapDoc = await getDoc(doc(db, 'mindMaps', mapId));
        if (mapDoc.exists()) {
          const mapData = { id: mapDoc.id, ...mapDoc.data() } as MindMap;
          const nodesSnap = await getDocs(collection(db, 'mindMaps', mapId, 'nodes'));
          const edgesSnap = await getDocs(collection(db, 'mindMaps', mapId, 'edges'));

          const nodes: Node[] = nodesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Node));
          const edges: Edge[] = edgesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Edge));

          return { map: mapData, nodes, edges };
        }
      } catch (err) {
        console.warn('Firestore fetch failed, checking local cache:', err);
      }
    }

    // Check local storage
    const rawMaps = localStorage.getItem(LOCAL_STORAGE_MAPS_KEY);
    const maps: MindMap[] = rawMaps ? JSON.parse(rawMaps) : this.getStarterMaps('guest');
    const targetMap = maps.find((m) => m.id === mapId);

    if (!targetMap) {
      // Check starter maps
      const starters = this.getStarterMaps('guest');
      const starter = starters.find((s) => s.id === mapId);
      if (starter) {
        return this.getStarterMapDetails(starter.id);
      }
      return null;
    }

    const rawNodes = localStorage.getItem(LOCAL_STORAGE_NODES_PREFIX + mapId);
    const rawEdges = localStorage.getItem(LOCAL_STORAGE_EDGES_PREFIX + mapId);

    const nodes: Node[] = rawNodes ? JSON.parse(rawNodes) : [];
    const edges: Edge[] = rawEdges ? JSON.parse(rawEdges) : [];

    return { map: targetMap, nodes, edges };
  }

  /**
   * Save or update map, its nodes and edges
   */
  public static async saveMap(map: MindMap, nodes: Node[], edges: Edge[]): Promise<void> {
    const updatedMap: MindMap = {
      ...map,
      nodesCount: nodes.length,
      updatedAt: Date.now(),
    };

    // Always keep updated in local storage for instantaneous offline responsiveness
    try {
      const rawMaps = localStorage.getItem(LOCAL_STORAGE_MAPS_KEY);
      let maps: MindMap[] = rawMaps ? JSON.parse(rawMaps) : [];
      const index = maps.findIndex((m) => m.id === map.id);
      if (index >= 0) {
        maps[index] = updatedMap;
      } else {
        maps.unshift(updatedMap);
      }
      localStorage.setItem(LOCAL_STORAGE_MAPS_KEY, JSON.stringify(maps));
      localStorage.setItem(LOCAL_STORAGE_NODES_PREFIX + map.id, JSON.stringify(nodes));
      localStorage.setItem(LOCAL_STORAGE_EDGES_PREFIX + map.id, JSON.stringify(edges));
    } catch (e) {
      console.warn('Local storage write warning:', e);
    }

    // Persist to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'mindMaps', map.id), {
          ...updatedMap,
          updatedAt: serverTimestamp(),
        });

        // Batch or individual subcollection writes
        for (const node of nodes) {
          await setDoc(doc(db, 'mindMaps', map.id, 'nodes', node.id), node);
        }
        for (const edge of edges) {
          await setDoc(doc(db, 'mindMaps', map.id, 'edges', edge.id), edge);
        }
      } catch (err) {
        console.error('Firestore save failed:', err);
      }
    }
  }

  /**
   * Delete map and its records
   */
  public static async deleteMap(mapId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_MAPS_KEY);
      if (raw) {
        const maps: MindMap[] = JSON.parse(raw);
        const filtered = maps.filter((m) => m.id !== mapId);
        localStorage.setItem(LOCAL_STORAGE_MAPS_KEY, JSON.stringify(filtered));
      }
      localStorage.removeItem(LOCAL_STORAGE_NODES_PREFIX + mapId);
      localStorage.removeItem(LOCAL_STORAGE_EDGES_PREFIX + mapId);
    } catch (e) {
      console.error(e);
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'mindMaps', mapId));
      } catch (err) {
        console.error('Firestore delete failed:', err);
      }
    }
  }

  /**
   * Flashcard and study records management
   */
  public static async getFlashcards(userId: string): Promise<Flashcard[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_FLASHCARDS_KEY);
    const list: Flashcard[] = raw ? JSON.parse(raw) : [];
    return list.filter((f) => f.userId === userId || userId === 'guest');
  }

  public static async saveFlashcard(card: Flashcard): Promise<void> {
    const raw = localStorage.getItem(LOCAL_STORAGE_FLASHCARDS_KEY);
    let list: Flashcard[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      list[idx] = card;
    } else {
      list.push(card);
    }
    localStorage.setItem(LOCAL_STORAGE_FLASHCARDS_KEY, JSON.stringify(list));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'flashcards', card.id), card);
      } catch (err) {
        console.warn('Firestore flashcard save failed:', err);
      }
    }
  }

  public static async recordStudySession(session: StudySession): Promise<void> {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    const list: StudySession[] = raw ? JSON.parse(raw) : [];
    list.unshift(session);
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(list.slice(0, 100)));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'studySessions', session.id), session);
      } catch (e) {
        console.warn('Firestore session log error:', e);
      }
    }
  }

  public static async getStudySessions(userId: string): Promise<StudySession[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    const list: StudySession[] = raw ? JSON.parse(raw) : [];
    return list.filter((s) => s.userId === userId || userId === 'guest');
  }

  /**
   * Default starter maps for immediate out-of-the-box experience
   */
  public static getStarterMaps(userId: string): MindMap[] {
    return [
      {
        id: 'starter-neural-networks',
        title: 'Deep Learning & Neural Networks',
        description: 'Comprehensive architectural breakdown of perceptrons, backpropagation, CNNs, and Transformers.',
        ownerId: userId,
        style: 'traditional',
        layoutDirection: 'LR',
        theme: 'purple',
        tags: ['AI', 'Deep Learning', 'Computer Science'],
        category: 'Artificial Intelligence',
        nodesCount: 7,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 3600000,
        isFavorite: true,
      },
      {
        id: 'starter-operating-systems',
        title: 'Operating Systems & Concurrency',
        description: 'Process scheduling, virtual memory paging, semaphores, and deadlock prevention.',
        ownerId: userId,
        style: 'radial',
        layoutDirection: 'radial',
        theme: 'ocean',
        tags: ['Systems', 'Computer Science', 'Concurrency'],
        category: 'Computer Science',
        nodesCount: 8,
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 7200000,
        isFavorite: false,
      },
      {
        id: 'starter-cornell-notes',
        title: 'Distributed Systems & Consensus (Cornell Format)',
        description: 'Structured Cornell method notes on Paxos, Raft, and CAP theorem.',
        ownerId: userId,
        style: 'cornell',
        layoutDirection: 'TB',
        theme: 'forest',
        tags: ['Distributed Systems', 'Consensus', 'Notes'],
        category: 'Engineering',
        nodesCount: 6,
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 1800000,
        isFavorite: true,
      },
    ];
  }

  public static getStarterMapDetails(mapId: string): { map: MindMap; nodes: Node[]; edges: Edge[] } {
    if (mapId === 'starter-operating-systems') {
      const nodes: Node[] = [
        {
          id: 'os-root',
          type: 'mindForgeNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'Operating System Core',
            description: 'The fundamental software that manages computer hardware and software resources.',
            isRoot: true,
            category: 'Core System',
            difficulty: 'medium',
            color: '#0284c7',
          },
        },
        {
          id: 'os-cpu',
          type: 'mindForgeNode',
          position: { x: 300, y: -180 },
          data: {
            label: 'CPU Scheduling',
            description: 'Algorithms determining which process runs (Round Robin, CFS, Multilevel Queue).',
            category: 'Scheduling',
            difficulty: 'medium',
            isFlashcard: true,
            flashcardQuestion: 'What is the goal of the Completely Fair Scheduler (CFS) in Linux?',
            flashcardAnswer: 'To maximize CPU utilization while ensuring interactive fairness using virtual runtime (vruntime) and a red-black tree.',
          },
        },
        {
          id: 'os-mem',
          type: 'mindForgeNode',
          position: { x: 300, y: 180 },
          data: {
            label: 'Virtual Memory & Paging',
            description: 'Memory virtualization using Page Tables, TLB caches, and Page Fault handlers.',
            category: 'Memory',
            difficulty: 'hard',
            isFlashcard: true,
            flashcardQuestion: 'What causes a Page Fault?',
            flashcardAnswer: 'When a program attempts to access a virtual memory address whose page table entry is marked non-present in physical RAM.',
          },
        },
        {
          id: 'os-deadlock',
          type: 'mindForgeNode',
          position: { x: -300, y: -180 },
          data: {
            label: 'Deadlock & Concurrency',
            description: 'Four Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.',
            category: 'Concurrency',
            difficulty: 'hard',
          },
        },
        {
          id: 'os-fs',
          type: 'mindForgeNode',
          position: { x: -300, y: 180 },
          data: {
            label: 'File Systems & I/O',
            description: 'Inodes, journaling, disk buffers, and async I/O completion.',
            category: 'Storage',
            difficulty: 'medium',
          },
        },
      ];

      const edges: Edge[] = [
        { id: 'e-os-1', source: 'os-root', target: 'os-cpu', type: 'mindForgeEdge', data: { label: 'allocates' } },
        { id: 'e-os-2', source: 'os-root', target: 'os-mem', type: 'mindForgeEdge', data: { label: 'virtualizes' } },
        { id: 'e-os-3', source: 'os-root', target: 'os-deadlock', type: 'mindForgeEdge', data: { label: 'synchronizes' } },
        { id: 'e-os-4', source: 'os-root', target: 'os-fs', type: 'mindForgeEdge', data: { label: 'persists to' } },
      ];

      return {
        map: {
          id: 'starter-operating-systems',
          title: 'Operating Systems & Concurrency',
          ownerId: 'guest',
          style: 'radial',
          layoutDirection: 'radial',
          theme: 'ocean',
          tags: ['Systems', 'Computer Science'],
          category: 'Computer Science',
          nodesCount: nodes.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        nodes,
        edges,
      };
    }

    // Default Deep Learning map
    const nodes: Node[] = [
      {
        id: 'dl-root',
        type: 'mindForgeNode',
        position: { x: 0, y: 150 },
        data: {
          label: 'Neural Networks Architecture',
          description: 'Layered computational graph capable of approximating continuous functions.',
          isRoot: true,
          category: 'AI / ML',
          difficulty: 'hard',
          color: '#7c3aed',
        },
      },
      {
        id: 'dl-backprop',
        type: 'mindForgeNode',
        position: { x: 340, y: 0 },
        data: {
          label: 'Backpropagation & Gradient Descent',
          description: 'Chain rule of calculus applied backwards through computational layers.',
          category: 'Optimization',
          difficulty: 'hard',
          isFlashcard: true,
          flashcardQuestion: 'How does backpropagation compute weight updates?',
          flashcardAnswer: 'By computing the partial derivative of the loss function with respect to each weight using the multivariate chain rule.',
        },
      },
      {
        id: 'dl-activations',
        type: 'mindForgeNode',
        position: { x: 340, y: 150 },
        data: {
          label: 'Nonlinear Activation Functions',
          description: 'Introduces nonlinearity (ReLU, GELU, Sigmoid, Softmax) allowing approximation beyond linear hyperplanes.',
          category: 'Layers',
          difficulty: 'medium',
        },
      },
      {
        id: 'dl-attention',
        type: 'mindForgeNode',
        position: { x: 340, y: 300 },
        data: {
          label: 'Self-Attention & Transformers',
          description: 'Scaled Dot-Product Attention: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) * V.',
          category: 'Transformers',
          difficulty: 'expert',
          formula: 'Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
          isFlashcard: true,
          flashcardQuestion: 'What is the purpose of dividing by sqrt(d_k) in Scaled Dot-Product Attention?',
          flashcardAnswer: 'To prevent the dot products from growing excessively large for large dimensions, which would push the softmax function into regions with vanishing gradients.',
        },
      },
      {
        id: 'dl-regularization',
        type: 'mindForgeNode',
        position: { x: 680, y: 0 },
        data: {
          label: 'Regularization Techniques',
          description: 'Dropout, Weight Decay (L2), Batch Normalization, and Early Stopping to avoid overfitting.',
          category: 'Generalization',
          difficulty: 'medium',
        },
      },
      {
        id: 'dl-transformer-blocks',
        type: 'mindForgeNode',
        position: { x: 680, y: 300 },
        data: {
          label: 'Residual Connections & LayerNorm',
          description: 'Highway connections x + F(x) preventing vanishing gradients across deep stacks.',
          category: 'Transformers',
          difficulty: 'hard',
        },
      },
    ];

    const edges: Edge[] = [
      { id: 'e-dl-1', source: 'dl-root', target: 'dl-backprop', type: 'mindForgeEdge', data: { label: 'trained via' } },
      { id: 'e-dl-2', source: 'dl-root', target: 'dl-activations', type: 'mindForgeEdge', data: { label: 'composed of' } },
      { id: 'e-dl-3', source: 'dl-root', target: 'dl-attention', type: 'mindForgeEdge', data: { label: 'evolved into' } },
      { id: 'e-dl-4', source: 'dl-backprop', target: 'dl-regularization', type: 'mindForgeEdge', data: { label: 'constrained by' } },
      { id: 'e-dl-5', source: 'dl-attention', target: 'dl-transformer-blocks', type: 'mindForgeEdge', data: { label: 'encapsulated in' } },
    ];

    return {
      map: {
        id: 'starter-neural-networks',
        title: 'Deep Learning & Neural Networks',
        ownerId: 'guest',
        style: 'traditional',
        layoutDirection: 'LR',
        theme: 'purple',
        tags: ['AI', 'Deep Learning'],
        category: 'Artificial Intelligence',
        nodesCount: nodes.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      nodes,
      edges,
    };
  }
}
