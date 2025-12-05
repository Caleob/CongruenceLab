
import React, { useState, useEffect, useCallback } from 'react';
import { TriangleData, DroppedTriangleState, LabelPermutation, CongruenceType, ValidationDetails } from './types';
import { generateGameData, checkAnswer } from './utils/geometry';
import TriangleSVG from './components/TriangleSVG';
import { RotateCw, RotateCcw, MoveHorizontal, RefreshCw, CheckCircle2, GripVertical, AlertCircle, Play, TriangleAlert, X, MousePointerClick } from 'lucide-react';

// Triangle Meter Component
const TriangleMeter = ({ score, max = 30, className = "w-12 h-12" }: { score: number, max?: number, className?: string }) => {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  
  return (
    <div className={`relative ${className}`}>
      {/* Background Triangle */}
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-sm">
        <path d="M 50 10 L 90 90 L 10 90 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Fill Triangle */}
        <defs>
          <linearGradient id="fillGrad" x1="0" x2="0" y1="1" y2="0">
             <stop offset={`${percentage}%`} stopColor="#4f46e5" />
             <stop offset={`${percentage}%`} stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d="M 50 10 L 90 90 L 10 90 Z" fill="url(#fillGrad)" stroke="none" />
        
        {/* Border Overlay */}
        <path d="M 50 10 L 90 90 L 10 90 Z" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const App: React.FC = () => {
  const [target, setTarget] = useState<TriangleData | null>(null);
  const [choices, setChoices] = useState<TriangleData[]>([]);
  const [targetType, setTargetType] = useState<CongruenceType>('SSS');
  
  // Game State
  const [score, setScore] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [selectedTheorem, setSelectedTheorem] = useState<CongruenceType | null>(null);

  // Drop Zone State
  const [rightSlot, setRightSlot] = useState<string | null>(null);
  const [rightState, setRightState] = useState<DroppedTriangleState>({ rotation: 0, flipped: false });

  // Congruence Statement State (Right Side Permutation: XYZ order)
  const [userPerm, setUserPerm] = useState<LabelPermutation>([0, 1, 2]);

  const [feedback, setFeedback] = useState<ValidationDetails | null>(null);

  const initGame = useCallback(() => {
    const data = generateGameData();
    setTarget(data.target);
    setChoices(data.choices);
    setTargetType(data.targetType);
    setRightSlot(null);
    setRightState({ rotation: 0, flipped: false });
    setUserPerm([0, 1, 2]);
    setSelectedTheorem(null);
    setFeedback(null);
    setRoundComplete(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleSelect = (id: string) => {
    if (roundComplete) return;
    setRightSlot(id);
    setRightState({ rotation: 0, flipped: false });
    setFeedback(null);
  };

  const rotateTriangle = (direction: 1 | -1) => {
    if (roundComplete) return;
    setRightState(p => ({ ...p, rotation: p.rotation + (direction * 15) }));
  };

  const flipTriangle = () => {
    if (roundComplete) return;
    setRightState(p => ({ ...p, flipped: !p.flipped }));
  };

  const rotateLetters = (direction: 1 | -1) => {
    if (roundComplete) return;
    if (direction === 1) {
       // Clockwise: C A B -> [2, 0, 1]
       setUserPerm(prev => [prev[2], prev[0], prev[1]]);
    } else {
       // Counter-Clockwise: B C A -> [1, 2, 0]
       setUserPerm(prev => [prev[1], prev[2], prev[0]]);
    }
  };

  const flipLetters = () => {
    if (roundComplete) return;
    setUserPerm(prev => [prev[2], prev[1], prev[0]]);
  };

  const handleFinalSubmit = () => {
    if (roundComplete || !target) return;
    if (!selectedTheorem) {
      setFeedback({
        triangle: 'incorrect', // Dummy values to show message
        theorem: 'incorrect',
        statement: 'incorrect',
        messages: ["Please select a justification theorem (SSS, SAS, ASA, HL)"],
        isCompleteSuccess: false,
        expectedTheorem: targetType
      });
      return;
    }

    const chosen = choices.find(t => t.id === rightSlot);
    const correctChoice = choices.find(t => t.id === 'correct');
    
    // Pass target to validation logic to account for variable vertex labels
    const result = checkAnswer(chosen, userPerm, selectedTheorem, targetType, correctChoice, target);
    
    setFeedback(result);

    // Score Calculation
    let delta = 0;
    
    // Triangle (+1 or -0.33)
    if (result.triangle === 'correct') delta += 1;
    else if (result.triangle === 'incorrect') delta -= 0.33;

    // Theorem (+1 or -0.5)
    if (result.theorem === 'correct') delta += 1;
    else delta -= 0.5;

    // Statement (+1 or -0.2)
    // Only score statement if triangle is not missing
    if (result.triangle !== 'missing') {
      if (result.statement === 'correct') delta += 1;
      else delta -= 0.2;
    }

    setScore(s => Math.min(30, Math.max(0, s + delta)));
    
    // We mark round complete immediately so inputs stop, 
    // but the user advances only by closing the modal.
    setRoundComplete(true); 
  };

  const handleCloseFeedback = () => {
    setFeedback(null);
    initGame(); // Automatically advance to next problem
  };

  const renderTarget = () => {
    if (!target) return null;
    return (
       <div className="w-full h-full p-4 relative">
          <div className="absolute top-2 left-2 px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded">TARGET</div>
          <TriangleSVG data={target} showLabels={true} labels={['A', 'B', 'C']} />
       </div>
    );
  };

  const renderDropped = () => {
    const data = choices.find(t => t.id === rightSlot);
    if (!data) return (
      <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center animate-pulse">
        <MousePointerClick className="w-8 h-8 mb-2 opacity-50" />
        <span className="font-medium">Click a candidate triangle<br/>above to select</span>
      </div>
    );

    return (
       <div className="w-full h-full p-4 relative animate-in zoom-in-95 duration-200">
         <TriangleSVG 
            data={data} 
            rotation={rightState.rotation} 
            flip={rightState.flipped} 
            showLabels={true} 
            labels={['X', 'Y', 'Z']}
         />
       </div>
    );
  };

  const ToolButton = ({ onClick, icon: Icon, title, vertical = false, disabled = false }: any) => (
    <button 
      title={title} 
      onClick={onClick} 
      disabled={disabled}
      className={`
        p-3 bg-white border border-slate-200 shadow-sm transition-colors
        ${vertical ? 'rounded-xl' : 'rounded-lg'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 hover:border-indigo-300 text-slate-600'}
      `}
    >
      <Icon size={24} />
    </button>
  );

  // Helper for Statement Letters
  const formatStatement = (indices: number[]) => {
      const letters = ['X', 'Y', 'Z'];
      return `△ABC ≅ △${letters[indices[0]]}${letters[indices[1]]}${letters[indices[2]]}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 gap-6 bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
             Congruence Lab
           </h1>
        </div>
        
        <div className="flex items-center gap-6">
           <button 
             onClick={initGame} 
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all"
           >
             <RefreshCw size={18} /> Reset
           </button>
        </div>
      </header>

      {/* Row 1: Bank */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Triangles</h2>
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {choices.map((t) => {
             const isSelected = rightSlot === t.id;
             return (
              <div 
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`
                  w-24 h-24 sm:w-28 sm:h-28 relative transition-all duration-200 rounded-xl
                  ${isSelected 
                    ? 'ring-4 ring-indigo-500 ring-offset-4 scale-105 z-10 bg-indigo-50/50' 
                    : 'hover:bg-slate-50 hover:scale-105 cursor-pointer ring-1 ring-slate-100'
                  }
                  ${roundComplete ? 'pointer-events-none opacity-80' : ''}
                `}
              >
                <TriangleSVG data={t} showLabels={true} labels={['X', 'Y', 'Z']} />
              </div>
             );
          })}
        </div>
      </div>

      {/* Row 2: Workspace */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 items-stretch justify-center h-auto min-h-[350px]">
        {/* Left: Fixed Target */}
        <div className="flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden">
          {renderTarget()}
        </div>

        {/* Center: Tools */}
        <div className="flex md:flex-col justify-center gap-3 py-2">
           <ToolButton title="Rotate Left" onClick={() => rotateTriangle(-1)} icon={RotateCcw} vertical disabled={roundComplete} />
           <ToolButton title="Flip" onClick={flipTriangle} icon={MoveHorizontal} vertical disabled={roundComplete} />
           <ToolButton title="Rotate Right" onClick={() => rotateTriangle(1)} icon={RotateCw} vertical disabled={roundComplete} />
        </div>

        {/* Right: Inspection Zone */}
        <div 
           className={`
             flex-1 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden transition-all
             ${rightSlot ? 'bg-white border-indigo-200 shadow-inner' : 'bg-slate-50 border-dashed border-slate-300'}
           `}
        >
          {renderDropped()}
        </div>
      </div>

      {/* Bottom Area: Controls & Scoring */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Left Side: Statement & Justification */}
        <div className="flex-1 flex flex-col gap-6">
            {/* Statement */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-start gap-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formulate Congruence Statement</h3>
               
               <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="text-2xl font-serif font-bold text-slate-700 tracking-wider">
                        △ A B C 
                     </div>
                     <div className="text-xl text-slate-400 font-bold">≅</div>
                     <div className="text-2xl font-serif font-bold text-slate-800 tracking-wider bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm min-w-[100px] text-center">
                        △ {['X','Y','Z'][userPerm[0]]} {['X','Y','Z'][userPerm[1]]} {['X','Y','Z'][userPerm[2]]}
                     </div>
                  </div>

                  {/* Text Controls - Mirroring Visual Controls */}
                  <div className="flex items-center gap-2">
                     <ToolButton title="Shift Letters Left" onClick={() => rotateLetters(-1)} icon={RotateCcw} disabled={roundComplete} />
                     <ToolButton title="Swap Order" onClick={flipLetters} icon={MoveHorizontal} disabled={roundComplete} />
                     <ToolButton title="Shift Letters Right" onClick={() => rotateLetters(1)} icon={RotateCw} disabled={roundComplete} />
                  </div>
               </div>
            </div>

            {/* Justification */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Justification</h3>
              <div className="flex flex-wrap gap-3 justify-start">
                {(['SSS', 'SAS', 'ASA', 'HL'] as CongruenceType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => !roundComplete && setSelectedTheorem(type)}
                      disabled={roundComplete}
                      className={`
                        px-8 py-3 border-2 font-bold rounded-xl transition-all shadow-sm
                        ${selectedTheorem === type 
                           ? 'bg-indigo-600 border-indigo-600 text-white transform -translate-y-1 shadow-md' 
                           : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                        }
                        ${roundComplete ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {type}
                    </button>
                ))}
              </div>
            </div>
        </div>

        {/* Right Side: Mastery & Submit */}
        <div className="w-full md:w-64 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                 MASTERY = {Math.round(Math.min(100, Math.max(0, (score / 30) * 100)))}%
               </h3>
               <TriangleMeter score={score} className="w-32 h-32" />
            </div>

            <button
               onClick={handleFinalSubmit}
               disabled={roundComplete}
               className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                  ${roundComplete 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 hover:translate-y-[-2px]'
                  }
               `}
            >
               {roundComplete ? 'Done' : 'Submit Answer'}
               {!roundComplete && <Play size={20} fill="currentColor" />}
            </button>
        </div>

      </div>

      {/* Detailed Feedback Modal */}
      {feedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal Header */}
            <div className={`p-6 flex items-center justify-between border-b ${feedback.isCompleteSuccess ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
               <div className="flex items-center gap-3">
                  {feedback.isCompleteSuccess 
                    ? <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                    : <TriangleAlert className="text-orange-500 w-8 h-8" />
                  }
                  <h2 className={`text-2xl font-bold ${feedback.isCompleteSuccess ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {feedback.isCompleteSuccess ? 'Success!' : 'Incorrect'}
                  </h2>
               </div>
               <button onClick={handleCloseFeedback} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500">
                  <X size={24} />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              
              {/* 1. Triangle Selection Status */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                 <div className="mt-1">
                    {feedback.triangle === 'correct' 
                      ? <CheckCircle2 className="text-emerald-500" size={24} />
                      : <TriangleAlert className="text-orange-500" size={24} />
                    }
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800">Triangle Selection</h4>
                    <p className="text-slate-600 text-sm mt-1">
                      {feedback.triangle === 'correct' 
                        ? "You selected the correct provable triangle."
                        : feedback.triangle === 'missing'
                          ? "You didn't select a triangle."
                          : "This triangle is not congruent or cannot be proven."
                      }
                    </p>
                 </div>
              </div>

              {/* 2. Statement Status */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                 <div className="mt-1">
                    {feedback.statement === 'correct' 
                      ? <CheckCircle2 className="text-emerald-500" size={24} />
                      : <TriangleAlert className="text-orange-500" size={24} />
                    }
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800">Congruence Statement</h4>
                    <p className="text-slate-600 text-sm mt-1">
                      {feedback.statement === 'correct'
                        ? "Your vertex correspondence is correct."
                        : feedback.expectedPermutation
                          ? <>Correct: <strong>{formatStatement(feedback.expectedPermutation)}</strong></>
                          : "Choose the correct triangle to define the statement."
                      }
                    </p>
                 </div>
              </div>

              {/* 3. Justification Status */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                 <div className="mt-1">
                    {feedback.theorem === 'correct' 
                      ? <CheckCircle2 className="text-emerald-500" size={24} />
                      : <TriangleAlert className="text-orange-500" size={24} />
                    }
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800">Justification</h4>
                    <p className="text-slate-600 text-sm mt-1">
                      {feedback.theorem === 'correct'
                        ? "Correct theorem selected."
                        : <>Correct Theorem: <strong>{feedback.expectedTheorem}</strong></>
                      }
                    </p>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
