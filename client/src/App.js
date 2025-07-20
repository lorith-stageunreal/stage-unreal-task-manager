// Full ClickUp-style task manager core with:
// - Sidebar, projects
// - Tasks with: priority, tags, assignees, due date, description, comments, subtasks
// - Kanban drag & drop

import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PlusIcon } from "@heroicons/react/24/solid";

const Sidebar = () => (
  <div className="h-screen w-64 bg-gray-800 text-white flex flex-col p-4 space-y-4">
    <h2 className="text-xl font-bold mb-6">🟣 ClickUp Clone</h2>
    <nav className="flex flex-col gap-3">
      <a href="#" className="hover:bg-gray-700 px-3 py-2 rounded">Dashboard</a>
      <a href="#" className="hover:bg-gray-700 px-3 py-2 rounded">Tasks</a>
      <a href="#" className="hover:bg-gray-700 px-3 py-2 rounded">Calendar</a>
      <a href="#" className="hover:bg-gray-700 px-3 py-2 rounded">Settings</a>
    </nav>
  </div>
);

const initialProjects = {
  ProjectA: {
    todo: [
      {
        id: "1",
        title: "Initial Setup",
        description: "Set up project files",
        dueDate: "2025-07-25",
        priority: "High",
        tags: ["setup"],
        assignee: "John",
        subtasks: [
          { id: "1-1", title: "Create repo", done: true },
          { id: "1-2", title: "Install deps", done: false }
        ],
        comments: ["Remember to init git."],
      },
    ],
    inprogress: [],
    done: [],
  },
};

export default function App() {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState("ProjectA");
  const [isOpen, setIsOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState("todo");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "",
    tags: "",
    assignee: "",
    subtasks: "",
  });

  const openModal = (columnId) => {
    setActiveColumn(columnId);
    setFormData({ title: "", description: "", dueDate: "", priority: "", tags: "", assignee: "", subtasks: "" });
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const addTask = () => {
    const newTask = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      priority: formData.priority,
      tags: formData.tags.split(","),
      assignee: formData.assignee,
      subtasks: formData.subtasks.split(",").map((t, i) => ({ id: `${Date.now()}-${i}`, title: t, done: false })),
      comments: [],
    };
    const updated = {
      ...projects[activeProject],
      [activeColumn]: [...projects[activeProject][activeColumn], newTask],
    };
    setProjects({ ...projects, [activeProject]: updated });
    closeModal();
  };

  const toggleSubtask = (col, taskId, subId) => {
    const updated = { ...projects };
    const task = updated[activeProject][col].find((t) => t.id === taskId);
    const subtask = task.subtasks.find((s) => s.id === subId);
    subtask.done = !subtask.done;
    setProjects(updated);
  };

  const addComment = (col, taskId, text) => {
    const updated = { ...projects };
    const task = updated[activeProject][col].find((t) => t.id === taskId);
    task.comments.push(text);
    setProjects(updated);
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    const srcTasks = [...projects[activeProject][source.droppableId]];
    const [moved] = srcTasks.splice(source.index, 1);
    const dstTasks = [...projects[activeProject][destination.droppableId]];
    dstTasks.splice(destination.index, 0, moved);

    setProjects((prev) => ({
      ...prev,
      [activeProject]: {
        ...prev[activeProject],
        [source.droppableId]: srcTasks,
        [destination.droppableId]: dstTasks,
      },
    }));
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🗂 {activeProject}</h1>
          <select
            className="bg-gray-800 text-white border px-2 py-1"
            value={activeProject}
            onChange={(e) => setActiveProject(e.target.value)}
          >
            {Object.keys(projects).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(projects[activeProject]).map(([col, tasks]) => (
              <Droppable key={col} droppableId={col}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-800 p-4 rounded"
                  >
                    <div className="flex justify-between mb-2">
                      <h2 className="capitalize font-bold">{col}</h2>
                      <button onClick={() => openModal(col)}>
                        <PlusIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className="bg-gray-700 p-3 rounded mb-3"
                          >
                            <div className="font-semibold">{task.title}</div>
                            <div className="text-sm text-gray-300">{task.description}</div>
                            <div className="text-xs mt-1">🎯 {task.priority} | 👤 {task.assignee} | 🕓 {task.dueDate}</div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.tags.map((tag, i) => (
                                <span key={i} className="bg-purple-600 text-xs px-2 py-1 rounded">#{tag}</span>
                              ))}
                            </div>
                            <div className="mt-2">
                              {task.subtasks.map((s) => (
                                <div key={s.id} className="flex items-center gap-2">
                                  <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(col, task.id, s.id)} />
                                  <span className={s.done ? "line-through" : ""}>{s.title}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <div className="text-sm font-semibold mb-1">💬 Comments</div>
                              {task.comments.map((c, i) => (
                                <div key={i} className="text-xs bg-gray-600 rounded px-2 py-1 mb-1">{c}</div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add comment"
                                className="w-full px-2 py-1 text-black rounded"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") addComment(col, task.id, e.target.value);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded bg-gray-800 text-white p-6 text-left align-middle shadow-xl">
                <Dialog.Title as="h3" className="text-lg font-medium mb-4">Create Task in {activeColumn}</Dialog.Title>
                {Object.entries(formData).map(([field, value]) => (
                  <input
                    key={field}
                    placeholder={field}
                    value={value}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
                  />
                ))}
                <div className="mt-4 flex justify-end">
                  <button onClick={addTask} className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-500">Create</button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
