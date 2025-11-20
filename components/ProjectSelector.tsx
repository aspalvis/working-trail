"use client";

import { useEffect, useState } from "react";

interface ProjectWithRate {
  name: string;
  hourlyRate: number;
}

interface ProjectSelectorProps {
  selectedProject: string | null;
  onProjectSelect: (project: string) => void;
}

export default function ProjectSelector({
  selectedProject,
  onProjectSelect,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectWithRate[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectRate, setNewProjectRate] = useState<string>("0");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Rate editing removed; managed in ProjectManager

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects || []);
      // Selected project rate handling moved to ProjectManager
    } catch (error) {
      console.error("Failed to load projects:", error);
      setError("Не удалось загрузить проекты");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      setError("Введите название проекта");
      return;
    }
    const rateNum = parseFloat(newProjectRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError("Некорректная ставка (>=0)");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: newProjectName.trim(), hourlyRate: rateNum }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      await loadProjects();
      const projectName = newProjectName.trim();
      setNewProjectName("");
      setNewProjectRate("0");
      setIsAddingProject(false);
      onProjectSelect(projectName);
      // Rate assignment moved to ProjectManager
    } catch (error: any) {
      setError(error.message || "Не удалось добавить проект. Убедитесь, что файл Excel не открыт.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (projectName: string) => {
    onProjectSelect(projectName);
  };

  // handleSaveRate removed

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Projects</h2>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="space-y-3 mb-4">
          {projects.map((project, index) => (
            <button
              key={project.name}
              onClick={() => handleSelect(project.name)}
              className={`group w-full p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-102 ${
                selectedProject === project.name
                  ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedProject === project.name
                        ? "bg-white/20"
                        : "bg-indigo-100 dark:bg-indigo-900 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        selectedProject === project.name
                          ? "text-white"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-lg">{project.name}</span>
                </div>
                {selectedProject === project.name && (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="mt-2 text-xs text-indigo-50/90 group-hover:text-white">
                Rate: {project.hourlyRate.toFixed(2)} €/h
              </div>
            </button>
          ))}
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className="mb-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">No projects</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create your first project</p>
        </div>
      )}

      {!isAddingProject ? (
        <button
          onClick={() => setIsAddingProject(true)}
          className="w-full p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Project
          </div>
        </button>
      ) : (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isSubmitting && handleAddProject()}
            placeholder="Project name"
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition-all"
            autoFocus
            disabled={isSubmitting}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={newProjectRate}
            onChange={(e) => setNewProjectRate(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isSubmitting && handleAddProject()}
            placeholder="Rate (€/h)"
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none transition-all"
            disabled={isSubmitting}
          />
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddProject}
              disabled={isSubmitting}
              className="flex-1 p-3 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Add
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsAddingProject(false);
                setNewProjectName("");
                setError("");
              }}
              disabled={isSubmitting}
              className="flex-1 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project rate editing moved to ProjectManager */}
    </div>
  );
}
