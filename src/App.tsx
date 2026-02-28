/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Library, PenTool, LayoutDashboard } from "lucide-react";
import GeneratorView from "./components/GeneratorView";
import EditorView from "./components/EditorView";
import LibraryView from "./components/LibraryView";
import { Article, Draft } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "generator" | "editor" | "library"
  >("generator");
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem("fitness_blog_articles");
    return saved ? JSON.parse(saved) : [];
  });
  const [draft, setDraft] = useState<Draft | null>(() => {
    const saved = localStorage.getItem("fitness_blog_draft");
    return saved ? JSON.parse(saved) : null;
  });

  // Auto-save draft every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (draft) {
        const updatedDraft = { ...draft, lastSaved: Date.now() };
        setDraft(updatedDraft);
        localStorage.setItem(
          "fitness_blog_draft",
          JSON.stringify(updatedDraft),
        );
        console.log("Auto-saved draft at", new Date().toLocaleTimeString());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [draft]);

  // Save articles to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("fitness_blog_articles", JSON.stringify(articles));
  }, [articles]);

  const handleSaveDraft = (newDraft: Draft) => {
    setDraft(newDraft);
    localStorage.setItem("fitness_blog_draft", JSON.stringify(newDraft));
  };

  const handleSaveToLibrary = () => {
    if (!draft) return;
    const newArticle: Article = {
      id: uuidv4(),
      title: draft.title,
      content: draft.content,
      chinese_translation: draft.chinese_translation,
      topic: draft.topic,
      language: draft.language,
      createdAt: Date.now(),
      isReference: false,
    };
    setArticles([newArticle, ...articles]);
    setDraft(null);
    localStorage.removeItem("fitness_blog_draft");
    setActiveTab("library");
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <PenTool className="w-6 h-6" />
            FitnessBlog AI
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("generator")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === "generator"
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            生成文章
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === "editor"
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PenTool className="w-5 h-5" />
            编辑器{" "}
            {draft && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-auto"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === "library"
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Library className="w-5 h-5" />
            文章库
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "generator" && (
          <GeneratorView
            articles={articles}
            onGenerated={(newDraft) => {
              handleSaveDraft(newDraft);
              setActiveTab("editor");
            }}
          />
        )}
        {activeTab === "editor" && (
          <EditorView
            draft={draft}
            onUpdateDraft={handleSaveDraft}
            onSaveToLibrary={handleSaveToLibrary}
          />
        )}
        {activeTab === "library" && (
          <LibraryView articles={articles} setArticles={setArticles} />
        )}
      </div>
    </div>
  );
}
