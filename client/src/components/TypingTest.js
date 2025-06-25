import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TypingTest = () => {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
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
      } catch (err) {
        setText('Error loading typing passage.');
        setTotalWords(0);
      }
    };
    fetchTypingText();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
        setElapsed(elapsed => elapsed + 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      finishTest();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTest = () => {
    setIsActive(true);
    setStartTime(Date.now());
    inputRef.current.focus();
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);
    
    const timeTaken = 60 - timeLeft;
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
    const newErrors = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== text[i]) {
        newErrors.push(i);
      }
    }
    setErrors(newErrors);
    
    // Update current index
    setCurrentIndex(value.length);
    
    // Calculate correct words
    const words = text.split(' ');
    const userWords = value.split(' ');
    let correct = 0;
    
    for (let i = 0; i < userWords.length - 1; i++) {
      if (userWords[i] === words[i]) {
        correct++;
      }
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
    if (index < currentIndex) {
      return errors.includes(index) ? 'typing-incorrect' : 'typing-correct';
    } else if (index === currentIndex) {
      return 'typing-cursor';
    } else {
      return 'typing-pending';
    }
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
              <div className="text-2xl font-bold text-red">{formatTime(timeLeft)}</div>
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
              You will have exactly 1 minute to type as many words as possible. 
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
              {text.split('').map((char, index) => (
                <span key={index} className={getCharacterClass(index)}>
                  {char}
                </span>
              ))}
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