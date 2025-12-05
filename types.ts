
export interface Point {
  x: number;
  y: number;
}

export type CongruenceType = 'SSS' | 'SAS' | 'ASA' | 'HL';

export interface TriangleStyle {
  // Indicies 0, 1, 2 correspond to sides: 0->(p0-p1), 1->(p1-p2), 2->(p2-p0)
  visibleSides: boolean[]; 
  // Indicies 0, 1, 2 correspond to angles at vertices 0, 1, 2
  visibleAngles: boolean[];
  // If true, show right angle marker at specific index
  rightAngleIndex?: number;
  // Color mapping for visual matching (e.g. side 0 is "red" group)
  sideColors: (string | null)[];
  angleColors: (string | null)[];
}

export interface TriangleData {
  id: string;
  points: [Point, Point, Point]; // Vertices relative to a center
  rotation: number; // in degrees, for initial random display
  isFlipped: boolean; // for initial display
  style: TriangleStyle;
  isCongruent: boolean; // secret flag for validation
  labelIndices: number[]; // Maps vertex index [0,1,2] to Label index [0,1,2] (e.g. 0->A, 1->B...)
}

export interface DroppedTriangleState {
  rotation: number; // visual rotation in degrees
  flipped: boolean; // horizontal flip
}

export type LabelPermutation = [number, number, number]; // e.g. [0, 1, 2] maps positions to labels

export interface ValidationDetails {
  triangle: 'correct' | 'incorrect' | 'missing';
  theorem: 'correct' | 'incorrect';
  statement: 'correct' | 'incorrect' | 'na'; // na if triangle missing/wrong
  messages: string[];
  isCompleteSuccess: boolean;
  // New fields for detailed feedback
  expectedTheorem: CongruenceType;
  expectedPermutation?: LabelPermutation; // The correct permutation for the statement
}
