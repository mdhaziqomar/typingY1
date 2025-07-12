import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TypingTest = () => {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDuration, setTimerDuration] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Fetch tournament typing text
    const fetchTypingText = async () => {
      const token = localStorage.getItem('studentToken');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tournamentId = payload.tournament_id;
      try {
        const response = await axios.get(`/api/tournaments/${tournamentId}`);
        setText(response.data.typing_text || '');
        setTotalWords((response.data.typing_text || '').split(' ').length);
        const duration = response.data.timer_duration !== undefined ? response.data.timer_duration : 60;
        setTimerDuration(duration);
        setTimeLeft(duration);
      } catch (err) {
        setText('Error loading typing passage.');
        setTotalWords(0);
      }
    };
    fetchTypingText();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && (timerDuration === 0 || timeLeft > 0)) {
      interval = setInterval(() => {
        if (timerDuration > 0) {
          setTimeLeft(timeLeft => timeLeft - 1);
        }
        setElapsed(elapsed => elapsed + 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive && timerDuration > 0) {
      finishTest();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerDuration]);

  const startTest = () => {
    setIsActive(true);
    setStartTime(Date.now());
    inputRef.current.focus();
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);
    
    const timeTaken = timerDuration === 0 ? elapsed : timerDuration - timeLeft;
    const calculatedWpm = Math.round((correctWords / timeTaken) * 60);
    const calculatedAccuracy = Math.round(((totalWords - errors.length) / totalWords) * 100);
    
    setWpm(calculatedWpm);
    setAccuracy(calculatedAccuracy);

    // Submit results
    try {
      const token = localStorage.getItem('studentToken');
      await axios.post('/api/results', {
        wpm: calculatedWpm,
        accuracy: calculatedAccuracy,
        total_words: totalWords,
        correct_words: correctWords,
        time_taken: timeTaken
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const handleInputChange = (e) => {
    if (!isActive && !isFinished) {
      startTest();
    }
    
    const value = e.target.value;
    setUserInput(value);
    
    // Check for errors
    const newErrors = [...errors]; // Keep existing errors
    
    // Simple character-by-character comparison
    for (let i = 0; i < value.length; i++) {
      if (i >= text.length || value[i] !== text[i]) {
        if (!newErrors.includes(i)) {
          newErrors.push(i);
        }
      } else {
        // Remove error if character is now correct
        const errorIndex = newErrors.indexOf(i);
        if (errorIndex > -1) {
          newErrors.splice(errorIndex, 1);
        }
      }
    }
    
    // Temporary debug
    if (newErrors.length > 0) {
      console.log('Errors detected at positions:', newErrors, 'Current index:', currentIndex);
      console.log('Text at error position:', text[newErrors[0]], 'Value at error position:', value[newErrors[0]]);
    }
    
    setErrors(newErrors);
    
    // Update current index
    setCurrentIndex(value.length);
    
    // Calculate correct words (strict: all chars including whitespace/line break must match)
    let correct = 0;
    let passageIdx = 0;
    let inputIdx = 0;
    while (passageIdx < text.length && inputIdx < value.length) {
      // Find next word boundary in passage
      let wordEnd = passageIdx;
      while (wordEnd < text.length && text[wordEnd] !== ' ' && text[wordEnd] !== '\n') {
        wordEnd++;
      }
      // The boundary char (space or line break)
      let boundaryChar = text[wordEnd] || '';
      // The word including boundary
      let passageWord = text.slice(passageIdx, wordEnd) + boundaryChar;
      let inputWord = value.slice(inputIdx, inputIdx + passageWord.length);
      if (inputWord === passageWord) {
        correct++;
      }
      passageIdx += passageWord.length;
      inputIdx += passageWord.length;
    }
    setCorrectWords(correct);

    // Live WPM update
    const seconds = elapsed > 0 ? elapsed : 1;
    setWpm(Math.round((correct / seconds) * 60));

    // Auto-end if finished
    if (value.length === text.length) {
      finishTest();
    }
  };

  const getCharacterClass = (index) => {
    // First check if this character has an error
    if (errors.includes(index)) {
      return 'typing-incorrect';
    }
    
    // Then check if it's the current cursor position
    if (index === currentIndex) {
      return 'typing-cursor';
    }
    
    // Then check if it's been typed (before current position)
    if (index < currentIndex) {
      return 'typing-correct';
    }
    
    // Otherwise it's pending
    return 'typing-pending';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFinished) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-base via-mantle to-crust">
        <div className="card max-w-2xl w-full mx-4 text-center">
          <h1 className="text-3xl font-bold text-text mb-6">Typing Challenge Complete!</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface1 rounded-lg p-4">
              <div className="text-2xl font-bold text-green">{wpm}</div>
              <div className="text-subtext0">Words Per Minute</div>
            </div>
            <div className="bg-surface1 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue">{accuracy}%</div>
              <div className="text-subtext0">Accuracy</div>
            </div>
            <div className="bg-surface1 rounded-lg p-4">
              <div className="text-2xl font-bold text-peach">{correctWords}</div>
              <div className="text-subtext0">Correct Words</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/results')}
              className="btn-primary px-8 py-3 text-lg"
            >
              View All Results
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary px-8 py-3 text-lg ml-4"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-base via-mantle to-crust p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            Chung Hwa Typing Competition
          </h1>
          <p className="text-subtext0">
            Welcome, {localStorage.getItem('studentName')} ({localStorage.getItem('studentClass')})
          </p>
        </div>

        {/* Timer and Stats */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red">
                {timerDuration === 0 ? '∞' : formatTime(timeLeft)}
              </div>
              <div className="text-subtext0">Time Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green">{wpm}</div>
              <div className="text-subtext0">WPM</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue">{accuracy}%</div>
              <div className="text-subtext0">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-peach">{correctWords}/{totalWords}</div>
              <div className="text-subtext0">Words</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!isActive && (
          <div className="card mb-6 text-center">
            <h2 className="text-xl font-semibold text-text mb-2">Ready to Start?</h2>
            <p className="text-subtext0 mb-4">
              {timerDuration === 0 ? (
                'You have unlimited time to complete the typing challenge.'
              ) : (
                `You will have exactly ${timerDuration / 60} minute${timerDuration / 60 > 1 ? 's' : ''} to type as many words as possible.`
              )}
              Start typing below to begin the challenge!
            </p>
            <button
              onClick={startTest}
              className="btn-success px-6 py-2"
            >
              Start Challenge
            </button>
          </div>
        )}

        {/* Typing Area */}
        <div className="card">
          <div className="mb-6">
            <div className="typing-text bg-surface1 p-6 rounded-lg min-h-[200px] leading-relaxed">
              {text.split('').map((char, index) => {
                let cls = '';
                let displayChar = char === ' ' ? '\u00A0' : char;
                // If a line break is expected but not typed, or vice versa, show a red block
                if (index < userInput.length) {
                  if (userInput[index] === char) {
                    cls = 'typing-correct';
                  } else {
                    // Special case: line break vs space or any other mismatch
                    if ((char === '\n' && userInput[index] !== '\n') || (char !== '\n' && userInput[index] === '\n')) {
                      cls = 'typing-incorrect';
                      displayChar = <span style={{display:'inline-block',width:'1em',height:'1em',background:'#f87171',borderRadius:'0.2em',verticalAlign:'middle'}} title="Line break error"></span>;
                    } else {
                      cls = 'typing-incorrect';
                    }
                  }
                } else if (index === userInput.length) {
                  cls = 'typing-cursor';
                } else {
                  cls = 'typing-pending';
                }
                return (
                  <span key={index} className={cls}>
                    {displayChar}
                  </span>
                );
              })}
            </div>
          </div>
          
          <div>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              className="input-field w-full h-32 resize-none font-mono text-lg"
              placeholder={isActive ? "Start typing here..." : "Click 'Start Challenge' to begin"}
              disabled={!isActive || isFinished}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="bg-surface1 rounded-full h-2">
            <div 
              className="bg-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / text.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-center text-subtext0 mt-2">
            Progress: {Math.round((currentIndex / text.length) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingTest; 