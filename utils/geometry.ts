
import { Point, TriangleData, TriangleStyle, CongruenceType, LabelPermutation, ValidationDetails } from '../types';
import { COLORS } from '../constants';

// --- MATH HELPERS ---

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const getCircumcenter = (p0: Point, p1: Point, p2: Point): Point => {
  const D = 2 * (p0.x * (p1.y - p2.y) + p1.x * (p2.y - p0.y) + p2.x * (p0.y - p1.y));
  if (Math.abs(D) < 0.001) return { x: (p0.x + p1.x + p2.x) / 3, y: (p0.y + p1.y + p2.y) / 3 };
  const Ux = (1 / D) * ((p0.x ** 2 + p0.y ** 2) * (p1.y - p2.y) + (p1.x ** 2 + p1.y ** 2) * (p2.y - p0.y) + (p2.x ** 2 + p2.y ** 2) * (p0.y - p1.y));
  const Uy = (1 / D) * ((p0.x ** 2 + p0.y ** 2) * (p2.x - p1.x) + (p1.x ** 2 + p1.y ** 2) * (p0.x - p2.x) + (p2.x ** 2 + p2.y ** 2) * (p1.x - p0.x));
  return { x: Ux, y: Uy };
};

// Center points around their circumcenter (or centroid if degenerate)
const centerPoints = (points: [Point, Point, Point]): [Point, Point, Point] => {
  const c = getCircumcenter(points[0], points[1], points[2]);
  const centroid = { x: (points[0].x + points[1].x + points[2].x)/3, y: (points[0].y + points[1].y + points[2].y)/3 };
  const dx = c.x - centroid.x;
  const dy = c.y - centroid.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // If circumcenter is too far (e.g. obtuse triangles), use centroid to keep it in view
  const center = dist > 50 ? centroid : c;

  return points.map(p => ({ x: p.x - center.x, y: p.y - center.y })) as [Point, Point, Point];
};

// Construct a triangle given Side 1 (base), Side 2, and the Angle (in degrees) between them.
const constructSAS = (s1: number, angleDeg: number, s2: number): [Point, Point, Point] => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: s1, y: 0 }; 
  const rad = degToRad(angleDeg);
  const p2 = { x: s2 * Math.cos(rad), y: s2 * Math.sin(rad) };
  return centerPoints([p0, p1, p2]);
};

// Construct a triangle given two angles and the included side.
const constructASA = (a1Deg: number, side: number, a2Deg: number): [Point, Point, Point] => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: side, y: 0 };
  
  const t1 = Math.tan(degToRad(a1Deg));
  const t2 = Math.tan(degToRad(180 - a2Deg)); // Slope from p1
  
  const x = (t2 * side) / (t2 - t1);
  const y = t1 * x;
  
  return centerPoints([p0, p1, { x, y }]);
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- GENERATION LOGIC ---

export const generateGameData = (): { target: TriangleData, choices: TriangleData[], targetType: CongruenceType } => {
  const types: CongruenceType[] = ['SSS', 'SAS', 'ASA', 'HL'];
  const targetType = types[Math.floor(Math.random() * types.length)];
  
  // Base Parameters
  const baseS1 = 80 + Math.random() * 40; // Side 0 Length
  const baseS2 = 80 + Math.random() * 40; // Side 2 Length
  const baseAngle = 45 + Math.random() * 70; // Angle at Vertex 0 (Included for SAS)
  
  // For ASA specifically
  const baseA1 = 40 + Math.random() * 30;
  const baseA2 = 40 + Math.random() * 30;
  const baseASide = 100 + Math.random() * 40;

  // For HL specifically
  const leg1 = 70 + Math.random() * 40;
  const leg2 = 70 + Math.random() * 40;

  let points: [Point, Point, Point];

  // Construct Base Geometry
  if (targetType === 'HL') {
    points = constructSAS(leg1, 90, leg2);
  } else if (targetType === 'ASA') {
    points = constructASA(baseA1, baseASide, baseA2);
  } else {
    // SSS and SAS use SAS construction
    points = constructSAS(baseS1, baseAngle, baseS2);
  }

  // Helper to create empty style
  const createStyle = (): TriangleStyle => ({
    visibleSides: [false, false, false],
    visibleAngles: [false, false, false],
    sideColors: [COLORS.bold[0], COLORS.bold[1], COLORS.bold[2]], // Always assign colors to indices
    angleColors: [COLORS.sector[0], COLORS.sector[1], COLORS.sector[2]],
    rightAngleIndex: undefined
  });

  const targetStyle = createStyle();
  
  // Define markings based on theorem for TARGET
  if (targetType === 'SSS') {
    targetStyle.visibleSides = [true, true, true];
  } else if (targetType === 'SAS') {
    targetStyle.visibleSides[0] = true; 
    targetStyle.visibleSides[2] = true; 
    targetStyle.visibleAngles[0] = true; 
  } else if (targetType === 'ASA') {
    targetStyle.visibleSides[0] = true;
    targetStyle.visibleAngles[0] = true;
    targetStyle.visibleAngles[1] = true;
  } else if (targetType === 'HL') {
    targetStyle.rightAngleIndex = 0;
    targetStyle.visibleSides[1] = true; // Hyp
    targetStyle.visibleSides[0] = true; // Leg
  }

  // --- TARGET OBJECT ---
  const target: TriangleData = {
    id: 'target',
    points: JSON.parse(JSON.stringify(points)),
    rotation: 0,
    isFlipped: false,
    style: targetStyle,
    isCongruent: true,
    labelIndices: shuffle([0, 1, 2]) // Randomize A, B, C placement
  };

  const choices: TriangleData[] = [];

  // 1. CORRECT CHOICE
  choices.push({
    id: 'correct',
    points: JSON.parse(JSON.stringify(points)),
    rotation: Math.floor(Math.random() * 360),
    isFlipped: Math.random() > 0.5,
    style: JSON.parse(JSON.stringify(targetStyle)), // Exact same markings
    isCongruent: true,
    labelIndices: shuffle([0, 1, 2])
  });

  // 2. UNPROVABLE / AMBIGUOUS CHOICE
  const unprovableStyle = createStyle();
  if (targetType === 'SSS') {
    unprovableStyle.visibleSides[0] = true; 
    unprovableStyle.visibleSides[2] = true; 
    unprovableStyle.visibleAngles[1] = true; 
  } else if (targetType === 'SAS') {
    unprovableStyle.visibleSides[0] = true; 
    unprovableStyle.visibleSides[2] = true; 
    unprovableStyle.visibleAngles[1] = true; 
  } else if (targetType === 'ASA') {
    unprovableStyle.visibleAngles = [true, true, true];
  } else if (targetType === 'HL') {
    unprovableStyle.visibleSides[1] = true; 
    unprovableStyle.visibleSides[0] = true; 
  }

  choices.push({
    id: 'unprovable',
    points: JSON.parse(JSON.stringify(points)),
    rotation: Math.floor(Math.random() * 360),
    isFlipped: Math.random() > 0.5,
    style: unprovableStyle,
    isCongruent: true, // Geometry IS congruent
    labelIndices: shuffle([0, 1, 2])
  });

  // 3. DISTRACTOR 1
  let d1Points: [Point, Point, Point] | null = null;
  const d1Style = createStyle();

  if (targetType === 'SSS') {
    d1Points = constructSAS(baseS1, baseAngle + 30, baseS2);
    d1Style.visibleSides[0] = true; 
    d1Style.visibleSides[2] = true; 
  } else if (targetType === 'SAS') {
    d1Points = constructSAS(baseS1, baseAngle + 30, baseS2);
    d1Style.visibleSides[0] = true; 
    d1Style.visibleSides[2] = true; 
  } else if (targetType === 'ASA') {
    d1Points = constructASA(baseA1, baseASide, baseA2 + 25);
    d1Style.visibleSides[0] = true;
    d1Style.visibleAngles[0] = true;
  } else if (targetType === 'HL') {
    d1Points = constructSAS(leg1, 90, leg2 * 1.5);
    d1Style.rightAngleIndex = 0;
    d1Style.visibleSides[0] = true; 
  }

  choices.push({
    id: 'distractor1',
    points: d1Points!,
    rotation: Math.floor(Math.random() * 360),
    isFlipped: Math.random() > 0.5,
    style: d1Style,
    isCongruent: false,
    labelIndices: shuffle([0, 1, 2])
  });

  // 4. DISTRACTOR 2
  let d2Points: [Point, Point, Point] | null = null;
  const d2Style = createStyle();

  if (targetType === 'SSS') {
    d2Points = constructSAS(baseS1, baseAngle - 20, baseS2 * 0.8);
    d2Style.visibleSides[0] = true;
  } else if (targetType === 'SAS') {
    d2Points = constructSAS(baseS1, baseAngle, baseS2 * 0.6);
    d2Style.visibleSides[0] = true;
    d2Style.visibleAngles[0] = true;
  } else if (targetType === 'ASA') {
    d2Points = constructASA(baseA1 + 30, baseASide, baseA2);
    d2Style.visibleSides[0] = true;
    d2Style.visibleAngles[1] = true;
  } else if (targetType === 'HL') {
    const hyp = Math.sqrt(leg1*leg1 + leg2*leg2);
    const newLeg1 = leg1 * 0.7;
    const newLeg2 = Math.sqrt(hyp*hyp - newLeg1*newLeg1);
    d2Points = constructSAS(newLeg1, 90, newLeg2);
    d2Style.rightAngleIndex = 0;
    d2Style.visibleSides[1] = true; 
  }

  choices.push({
    id: 'distractor2',
    points: d2Points!,
    rotation: Math.floor(Math.random() * 360),
    isFlipped: Math.random() > 0.5,
    style: d2Style,
    isCongruent: false,
    labelIndices: shuffle([0, 1, 2])
  });

  return {
    target,
    choices: shuffle(choices),
    targetType
  };
};

export const checkAnswer = (
  chosenTriangle: TriangleData | undefined,
  userPerm: LabelPermutation,
  reason: CongruenceType,
  targetType: CongruenceType,
  correctTriangle?: TriangleData,
  target?: TriangleData
): ValidationDetails => {
  const messages: string[] = [];
  let triangleRes: 'correct' | 'incorrect' | 'missing' = 'missing';
  let theoremRes: 'correct' | 'incorrect' = 'incorrect';
  let statementRes: 'correct' | 'incorrect' | 'na' = 'na';

  // 1. Check Triangle Choice
  if (!chosenTriangle) {
    messages.push("No triangle selected.");
    triangleRes = 'missing';
  } else if (chosenTriangle.id === 'correct') {
    triangleRes = 'correct';
  } else {
    triangleRes = 'incorrect';
    if (chosenTriangle.id === 'unprovable') {
      messages.push("Triangle is congruent, but markings are insufficient for proof.");
    } else {
      messages.push("Triangle is not congruent.");
    }
  }

  // 2. Check Theorem
  if (reason === targetType) {
    theoremRes = 'correct';
  } else {
    messages.push(`Incorrect theorem. This setup requires ${targetType}.`);
  }

  // 3. Check Statement
  if (triangleRes === 'correct' && chosenTriangle && target) {
    // Find the vertex index on Target that corresponds to label 'A' (index 0)
    const idxA = target.labelIndices.indexOf(0);
    const idxB = target.labelIndices.indexOf(1);
    const idxC = target.labelIndices.indexOf(2);

    // userPerm[0] corresponds to the user's choice for A
    // It should match the label at chosenTriangle.labelIndices[idxA]
    const isCorrespondenceCorrect = 
      userPerm[0] === chosenTriangle.labelIndices[idxA] &&
      userPerm[1] === chosenTriangle.labelIndices[idxB] &&
      userPerm[2] === chosenTriangle.labelIndices[idxC];

    if (isCorrespondenceCorrect) {
      statementRes = 'correct';
    } else {
      statementRes = 'incorrect';
      messages.push("Congruence statement incorrect. Check vertex correspondence.");
    }
  } else {
    statementRes = 'na';
    if (triangleRes !== 'missing') {
       messages.push("Cannot match vertices for incorrect triangle.");
    }
  }

  const isCompleteSuccess = 
    triangleRes === 'correct' && 
    theoremRes === 'correct' && 
    statementRes === 'correct';

  if (isCompleteSuccess) {
    messages.push("Correct! Valid congruence proof.");
  }

  // Calculate Expected Values for Feedback
  let expectedPermutation: LabelPermutation | undefined = undefined;
  
  if (chosenTriangle && chosenTriangle.id === 'correct' && target) {
      // Logic mirrors the check above
      const p = [0,0,0] as any;
      const idxA = target.labelIndices.indexOf(0);
      const idxB = target.labelIndices.indexOf(1);
      const idxC = target.labelIndices.indexOf(2);
      
      p[0] = chosenTriangle.labelIndices[idxA];
      p[1] = chosenTriangle.labelIndices[idxB];
      p[2] = chosenTriangle.labelIndices[idxC];
      expectedPermutation = p;
  } else if (correctTriangle && target) {
      // If they chose wrong, show them what matches the CORRECT triangle
      const p = [0,0,0] as any;
      const idxA = target.labelIndices.indexOf(0);
      const idxB = target.labelIndices.indexOf(1);
      const idxC = target.labelIndices.indexOf(2);

      p[0] = correctTriangle.labelIndices[idxA];
      p[1] = correctTriangle.labelIndices[idxB];
      p[2] = correctTriangle.labelIndices[idxC];
      expectedPermutation = p;
  }

  return {
    triangle: triangleRes,
    theorem: theoremRes,
    statement: statementRes,
    messages,
    isCompleteSuccess,
    expectedTheorem: targetType,
    expectedPermutation
  };
};
