import React, { useState, useEffect, useRef } from "react";
import { Draft } from "../types";
import { reviseArticle } from "../services/aiService";
import { Loader2, Save, Send, AlertCircle, CheckCircle2, XCircle, Download, Link as LinkIcon, BookOpen } from "lucide-react";
import Markdown from "react-markdown";

interface Props {
  draft: Draft | null;
  onUpdateDraft: (draft: Draft) => void;
  onSaveToLibrary: () => void;
}

export default function EditorView({
  draft,
  onUpdateDraft,
  onSaveToLibrary,
}: Props) {
  const [revisionRequest, setRevisionRequest] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of revision history when new items are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [draft?.revision_history]);

  // Auto-save notification effect
  useEffect(() => {
    if (draft?.lastSaved) {
      setSaveMessage(
        `已自动保存: ${new Date(draft.lastSaved).toLocaleTimeString()}`,
      );
      const timer = setTimeout(() => setSaveMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [draft?.lastSaved]);

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <p>当前没有正在编辑的草稿。</p>
        <p className="text-sm mt-2">请先到“生成文章”页面创建新内容。</p>
      </div>
    );
  }

  const handleRevise = async () => {
    if (!revisionRequest.trim()) return;
    setIsRevising(true);
    abortControllerRef.current = new AbortController();
    try {
      const result = await reviseArticle(
        draft.content,
        draft.chinese_translation,
        revisionRequest,
        draft.revision_history || [],
        abortControllerRef.current.signal
      );
      
      const newHistoryItem = {
        request: revisionRequest,
        notes: result.revision_notes || "已完成修改",
        timestamp: Date.now()
      };

      onUpdateDraft({
        ...draft,
        content: result.content || draft.content,
        chinese_translation:
          result.chinese_translation || draft.chinese_translation,
        revision_history: [...(draft.revision_history || []), newHistoryItem]
      });
      setRevisionRequest("");
    } catch (err: any) {
      if (err.message === 'AbortError') {
        console.log('Revision cancelled by user');
      } else {
        console.error(err);
        alert("修改失败，请重试。");
      }
    } finally {
      setIsRevising(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelRevise = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleExport = (format: 'md' | 'txt') => {
    if (!draft) return;
    
    const content = `# ${draft.title}\n\n## ${draft.language} Version\n\n${draft.content}\n\n---\n\n## 中文翻译\n\n${draft.chinese_translation}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.title || 'article'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onUpdateDraft({ ...draft, title: e.target.value })}
            className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none w-[500px] focus:ring-0 p-0"
            placeholder="文章标题"
          />
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">
              {draft.topic}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md">
              {draft.language}
            </span>
            {saveMessage && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {saveMessage}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              导出
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
              >
                导出为 .md
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
              >
                导出为 .txt
              </button>
            </div>
          </div>
          <button
            onClick={onSaveToLibrary}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            保存到文章库
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Content (Split into Target and Chinese) */}
        <div className="flex-1 flex border-r border-slate-200 bg-white overflow-hidden">
          {/* Target Language */}
          <div className="flex-1 flex flex-col border-r border-slate-200">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-slate-700">目标语言 ({draft.language})</span>
            </div>
            <textarea
              value={draft.content}
              onChange={(e) =>
                onUpdateDraft({ ...draft, content: e.target.value })
              }
              className="flex-1 w-full p-6 resize-none outline-none text-slate-700 leading-relaxed font-sans"
            />
          </div>
          
          {/* Chinese Translation */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-slate-700">中文翻译</span>
            </div>
            <textarea
              value={draft.chinese_translation}
              onChange={(e) =>
                onUpdateDraft({
                  ...draft,
                  chinese_translation: e.target.value,
                })
              }
              className="flex-1 w-full p-6 resize-none outline-none text-slate-700 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Right: AI Assistant & Logic Check */}
        <div className="w-96 bg-slate-50 flex flex-col">
          <div className="p-6 border-b border-slate-200 shrink-0">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              逻辑与质量检查
            </h3>
            <div className="mt-3 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200 max-h-48 overflow-auto">
              <div className="markdown-body">
                <Markdown>{draft.logic_check_notes}</Markdown>
              </div>
            </div>
          </div>

          {draft.references && draft.references.length > 0 && (
            <div className="p-6 border-b border-slate-200 shrink-0 bg-slate-100/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3 text-sm">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                参考来源
              </h3>
              <div className="space-y-2 max-h-40 overflow-auto pr-2">
                {draft.references.map((ref, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {ref.type === 'web' ? (
                      <LinkIcon className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    ) : (
                      <BookOpen className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    )}
                    {ref.url ? (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline line-clamp-2">
                        {ref.title}
                      </a>
                    ) : (
                      <span className="text-slate-600 line-clamp-2">
                        [文章库] {ref.title}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
            {draft.revision_history?.map((item, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">您的要求</span>
                  <p className="text-sm text-slate-700 mt-1">{item.request}</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI 修改说明</span>
                  <div className="text-sm text-indigo-700 mt-1 markdown-body">
                    <Markdown>{item.notes}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 pt-2 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <textarea
                value={revisionRequest}
                onChange={(e) => setRevisionRequest(e.target.value)}
                placeholder="告诉AI你需要如何修改这篇文章 (支持多次连续修改)..."
                className="w-full h-24 p-4 resize-none outline-none text-sm text-slate-700"
              />
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-end gap-2">
                {isRevising && (
                  <button
                    onClick={handleCancelRevise}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    截停
                  </button>
                )}
                <button
                  onClick={handleRevise}
                  disabled={isRevising || !revisionRequest.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isRevising ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  发送修改要求
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
