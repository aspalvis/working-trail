'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  timerId: string;
  project: string;
  onTimeSaved: () => void;
  onDelete: () => void;
}

export default function Timer({ timerId, project, onTimeSaved, onDelete }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      updateIntervalRef.current = setInterval(async () => {
        try {
          await fetch('/api/timers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update',
              timerId,
              elapsedTime
            })
          });
        } catch (error) {
          console.error('Error updating timer on server:', error);
        }
      }, 5000);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isRunning, elapsedTime, timerId]);

  const handleStart = async () => {
    setStartTime(new Date());
    setIsRunning(true);
    setElapsedTime(0);

    try {
      await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          timerId,
          project
        })
      });
    } catch (error) {
      console.error('Error starting timer on server:', error);
    }
  };

  const handleStop = async () => {
    setIsRunning(false);

    if (!startTime || elapsedTime === 0) return;

    setIsSaving(true);

    try {
      await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          timerId
        })
      });

      const endTime = new Date();
      const durationInHours = elapsedTime / 3600;

      const entry = {
        project,
        date: startTime.toLocaleDateString('ru-RU'),
        startTime: startTime.toLocaleTimeString('ru-RU'),
        endTime: endTime.toLocaleTimeString('ru-RU'),
        duration: parseFloat(durationInHours.toFixed(4)),
      };

      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to save time entry');
      }

      await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          timerId
        })
      });

      onTimeSaved();
      onDelete();
      setElapsedTime(0);
      setStartTime(null);
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Ошибка при сохранении времени. Убедитесь, что файл Excel не открыт.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот таймер?')) {
      return;
    }

    try {
      await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          timerId
        })
      });

      onDelete();
    } catch (error) {
      console.error('Error deleting timer:', error);
      alert('Ошибка при удалении таймера.');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full text-center relative border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg">
      <button
        onClick={handleDelete}
        disabled={isRunning || isSaving}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Удалить таймер"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-6">
        <div className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
          <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
            {project}
          </h2>
        </div>
      </div>

      <div className="relative mb-10">
        <div
          className={`text-7xl md:text-8xl font-mono font-bold transition-all duration-300 ${
            isRunning
              ? 'text-green-600 dark:text-green-400 animate-pulse'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {formatTime(elapsedTime)}
        </div>
        {isRunning && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
              <span>Идет запись</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center mb-6">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={isSaving}
            className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Старт
            </span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isSaving}
            className="group relative px-10 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Стоп
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {!isRunning && elapsedTime === 0 && !isSaving && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            💡 Нажмите "Старт" чтобы начать отслеживание времени
          </p>
        </div>
      )}

      {isSaving && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            ⏳ Сохранение данных в Excel...
          </p>
        </div>
      )}
    </div>
  );
}
