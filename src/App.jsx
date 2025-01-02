import React, { useState, useEffect, useRef } from 'react';
    import { formatDistanceToNow, differenceInSeconds, isBefore, differenceInDays, startOfDay } from 'date-fns';
    import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
    import 'react-circular-progressbar/dist/styles.css';

    const teamMembers = ['Gemeinsam', 'Vera', 'Stefan', 'Alex', 'tbd'];

    function TargetDateForm({ onSetTargetDate }) {
      const [targetDate, setTargetDate] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (targetDate) {
          onSetTargetDate(targetDate);
        }
      };

      return (
        <form className="mb-6 flex flex-col gap-2" onSubmit={handleSubmit}>
          <input
            type="datetime-local"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Set Target Date
          </button>
        </form>
      );
    }

    function Task({ task, targetDate, onDelete, onEdit, timelineStart, timelineEnd }) {
      const [timeRemaining, setTimeRemaining] = useState('');
      const [isEditing, setIsEditing] = useState(false);
      const [editedTaskName, setEditedTaskName] = useState(task.name);
      const [editedDueDate, setEditedDueDate] = useState(task.dueDate);
      const taskRef = useRef(null);

      useEffect(() => {
        const interval = setInterval(() => {
          setTimeRemaining(formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }));
        }, 1000);

        return () => clearInterval(interval);
      }, [task.dueDate]);

      const handleEdit = () => {
        setIsEditing(true);
      };

      const handleSave = () => {
        onEdit(task.id, editedTaskName, editedDueDate);
        setIsEditing(false);
      };

      const handleCancel = () => {
        setIsEditing(false);
        setEditedTaskName(task.name);
        setEditedDueDate(task.dueDate);
      };

      const calculateTaskProgress = () => {
        if (!targetDate) return 0;
        const totalSeconds = differenceInSeconds(new Date(task.dueDate), new Date(targetDate));
        const elapsedSeconds = differenceInSeconds(new Date(), new Date(targetDate));
        const progress = Math.max(0, Math.min(100, (elapsedSeconds / totalSeconds) * 100));
        return progress;
      };

      const calculatePosition = () => {
        if (!timelineStart || !timelineEnd) return 0;
        const taskDate = new Date(task.dueDate);
        const totalDuration = differenceInDays(timelineEnd, timelineStart);
        const taskOffset = differenceInDays(taskDate, timelineStart);
        const position = (taskOffset / totalDuration) * 100;
        return Math.max(0, Math.min(100, position));
      };

      const taskPosition = calculatePosition();

      return (
        <li
          ref={taskRef}
          className="bg-white shadow rounded p-4 mb-4 flex flex-col justify-between items-start"
          style={{ left: `${taskPosition}%`, width: '150px', position: 'absolute' }}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={editedTaskName}
                onChange={(e) => setEditedTaskName(e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="datetime-local"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                className="p-2 border rounded"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save</button>
                <button onClick={handleCancel} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">{task.name}</h3>
                <span className="font-bold text-gray-700">{timeRemaining}</span>
              </div>
              <div style={{ width: 50, height: 50 }}>
                <CircularProgressbar
                  value={calculateTaskProgress()}
                  text={`${Math.round(calculateTaskProgress())}%`}
                  styles={buildStyles({
                    textSize: '1.5rem',
                    pathColor: `rgba(62, 152, 199, ${calculateTaskProgress() / 100})`,
                    textColor: '#3e98c7',
                    trailColor: '#d6d6d6',
                  })}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={handleEdit} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">Edit</button>
                <button onClick={onDelete} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Delete</button>
              </div>
            </>
          )}
        </li>
      );
    }

    function TaskForm({ onAddTask }) {
      const [taskName, setTaskName] = useState('');
      const [dueDate, setDueDate] = useState('');
      const [team, setTeam] = useState('Gemeinsam');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (taskName && dueDate) {
          onAddTask({ name: taskName, dueDate: dueDate, id: Date.now(), team: team });
          setTaskName('');
          setDueDate('');
          setTeam('Gemeinsam');
        }
      };

      return (
        <form className="mb-6 flex flex-col gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="p-2 border rounded"
          />
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="p-2 border rounded"
          >
            {teamMembers.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add Task
          </button>
        </form>
      );
    }

    function App() {
      const [tasks, setTasks] = useState([]);
      const [targetDate, setTargetDate] = useState(null);

      const handleSetTargetDate = (date) => {
        setTargetDate(date);
      };

      const handleAddTask = (newTask) => {
        setTasks([...tasks, newTask]);
      };

      const handleDeleteTask = (id) => {
        setTasks(tasks.filter((task) => task.id !== id));
      };

      const handleEditTask = (id, newName, newDueDate) => {
        setTasks(tasks.map(task =>
          task.id === id ? { ...task, name: newName, dueDate: newDueDate } : task
        ));
      };

      const calculateOverallProgress = () => {
        if (!targetDate) return 0;
        const totalSeconds = differenceInSeconds(new Date(targetDate), new Date());
        const elapsedSeconds = differenceInSeconds(new Date(), new Date());
        const progress = Math.max(0, Math.min(100, (elapsedSeconds / totalSeconds) * 100));
        return progress;
      };

      const getTMinusLabel = (date) => {
        if (!targetDate) return '';
        const diffInDays = differenceInSeconds(new Date(targetDate), new Date(date)) / (60 * 60 * 24);
        if (diffInDays >= 0) {
          return `T-${Math.round(diffInDays)}`;
        } else {
          return 'Past';
        }
      };

      const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      const timelineTasks = sortedTasks.reduce((acc, task) => {
        const tMinusLabel = getTMinusLabel(task.dueDate);
        if (!acc[tMinusLabel]) {
          acc[tMinusLabel] = [];
        }
        acc[tMinusLabel].push(task);
        return acc;
      }, {});

      const timelineStart = targetDate ? startOfDay(new Date(Math.min(...tasks.map(task => new Date(task.dueDate))))) : null;
      const timelineEnd = targetDate ? startOfDay(new Date(targetDate)) : null;

      const generateTimelineScale = () => {
        if (!timelineStart || !timelineEnd) return [];
        const totalDays = differenceInDays(timelineEnd, timelineStart);
        const scale = [];
        for (let i = 0; i <= totalDays; i++) {
          const day = new Date(timelineStart);
          day.setDate(day.getDate() + i);
          scale.push({
            date: day,
            label: getTMinusLabel(day)
          });
        }
        return scale;
      };

      const timelineScale = generateTimelineScale();

      return (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">T-Minus Planner</h1>
          {!targetDate ? (
            <TargetDateForm onSetTargetDate={handleSetTargetDate} />
          ) : (
            <>
              <div className="mb-4 flex items-center">
                <h2 className="text-xl mr-4">Target Date: {new Date(targetDate).toLocaleString()}</h2>
                <div style={{ width: 50, height: 50 }}>
                  <CircularProgressbar
                    value={calculateOverallProgress()}
                    text={`${Math.round(calculateOverallProgress())}%`}
                    styles={buildStyles({
                      textSize: '1.5rem',
                      pathColor: `rgba(62, 152, 199, ${calculateOverallProgress() / 100})`,
                      textColor: '#3e98c7',
                      trailColor: '#d6d6d6',
                    })}
                  />
                </div>
              </div>
              <TaskForm onAddTask={handleAddTask} />
              <div className="relative">
                <div className="flex relative h-10">
                  {timelineScale.map((scaleItem, index) => {
                    const position = (index / (timelineScale.length - 1)) * 100;
                    return (
                      <div
                        key={index}
                        className="absolute top-0 text-center"
                        style={{ left: `${position}%`, width: `${100 / timelineScale.length}%` }}
                      >
                        <span className="text-sm">{scaleItem.label}</span>
                      </div>
                    )
                  })}
                </div>
                {Object.entries(timelineTasks).sort(([keyA], [keyB]) => {
                  const a = keyA.startsWith('T-') ? parseInt(keyA.substring(2)) : -Infinity;
                  const b = keyB.startsWith('T-') ? parseInt(keyB.substring(2)) : -Infinity;
                  return b - a;
                }).map(([tMinusLabel, tasks]) => (
                  <div key={tMinusLabel} className="mb-8 border-t-2 border-gray-300 pt-4">
                    <h3 className="text-2xl font-semibold mb-2">{tMinusLabel}</h3>
                    {teamMembers.map(member => {
                      const teamTasks = tasks.filter(task => task.team === member);
                      if (teamTasks.length === 0) return null;
                      return (
                        <div key={member} className="relative h-24">
                          <h4 className="text-xl font-semibold mb-2">{member}</h4>
                          <ul className="list-none p-0">
                            {teamTasks.map((task) => (
                              <Task key={task.id} task={task} targetDate={targetDate} onDelete={() => handleDeleteTask(task.id)} onEdit={handleEditTask} timelineStart={timelineStart} timelineEnd={timelineEnd} />
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    export default App;
