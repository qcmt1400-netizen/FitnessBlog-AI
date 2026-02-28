import React, { useState, useRef } from "react";
import { Article, Draft } from "../types";
import { generateArticle } from "../services/aiService";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  articles: Article[];
  onGenerated: (draft: Draft) => void;
}

const TOPICS = ["speedbike", "ROWING MACHINE", "TREADMILLS", "PILATES"];
const LANGUAGES = ["English", "Deutsch"];

export default function GeneratorView({ articles, onGenerated }: Props) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [instructions, setInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    abortControllerRef.current = new AbortController();
    try {
      // Find reference articles for the same topic
      const referenceArticles = articles.filter((a) => a.topic === topic);

      const result = await generateArticle(
        topic,
        language,
        instructions,
        referenceArticles,
        abortControllerRef.current.signal
      );

      const newDraft: Draft = {
        id: uuidv4(),
        title: result.title || "未命名文章",
        content: result.content || "",
        chinese_translation: result.chinese_translation || "",
        logic_check_notes: result.logic_check_notes || "",
        topic,
        language,
        lastSaved: Date.now(),
        references: result.references || []
      };

      onGenerated(newDraft);
    } catch (err: any) {
      if (err.message === 'AbortError') {
        console.log('Generation cancelled by user');
      } else {
        console.error(err);
        setError(err.message || "生成文章时发生错误，请重试。");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          生成新文章
        </h2>
        <p className="text-slate-500 mt-2">
          基于您的需求和历史文章库，AI将为您创作专业且通俗易懂的健身器材科普博客。
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              产品类目 (Topic)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    topic === t
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              目标语言 (Language)
            </label>
            <div className="flex gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    language === l
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            附加要求 (可选)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="例如：重点强调静音效果，或者加入一些幽默的元素..."
            className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none outline-none transition-all"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isGenerating ? (
          <button
            onClick={handleCancel}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            正在生成中... 点击截停
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            开始生成文章
          </button>
        )}
      </div>
    </div>
  );
}
