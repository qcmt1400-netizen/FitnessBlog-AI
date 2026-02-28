import React, { useState } from "react";
import { Article } from "../types";
import { Trash2, Plus, FileText, Search, X, Eye } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  articles: Article[];
  setArticles: (articles: Article[]) => void;
}

export default function LibraryView({ articles, setArticles }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    topic: "speedbike",
    language: "中文",
  });

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.topic.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这篇文章吗？")) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  };

  const handleAdd = () => {
    if (!newArticle.title || !newArticle.content) return;
    const article: Article = {
      id: uuidv4(),
      title: newArticle.title,
      content: newArticle.content,
      topic: newArticle.topic,
      language: newArticle.language,
      createdAt: Date.now(),
      isReference: true,
    };
    setArticles([article, ...articles]);
    setIsAdding(false);
    setNewArticle({
      title: "",
      content: "",
      topic: "speedbike",
      language: "中文",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            参考文章库
          </h2>
          <p className="text-slate-500 mt-2">
            管理历史文章，AI在生成新内容时会参考这些文章以避免重复。
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加参考文章
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              手动添加参考文章
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="文章标题"
                value={newArticle.title}
                onChange={(e) =>
                  setNewArticle({ ...newArticle, title: e.target.value })
                }
                className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-4">
                <select
                  value={newArticle.topic}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, topic: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                >
                  <option value="speedbike">speedbike</option>
                  <option value="ROWING MACHINE">ROWING MACHINE</option>
                  <option value="TREADMILLS">TREADMILLS</option>
                  <option value="PILATES">PILATES</option>
                </select>
                <select
                  value={newArticle.language}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, language: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                >
                  <option value="中文">中文</option>
                  <option value="English">English</option>
                  <option value="Deutsch">Deutsch</option>
                </select>
              </div>
            </div>
            <textarea
              placeholder="文章正文内容..."
              value={newArticle.content}
              onChange={(e) =>
                setNewArticle({ ...newArticle, content: e.target.value })
              }
              className="w-full h-40 px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                保存到库
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 relative shrink-0">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="搜索文章标题或类目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700">
                    {article.topic}
                  </span>
                  <span>{article.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingArticle(article)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                    title="查看内容"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">
                {article.content}
              </p>
              <div className="text-xs text-slate-400 flex items-center gap-1 pt-4 border-t border-slate-100">
                <FileText className="w-3 h-3" />
                {new Date(article.createdAt).toLocaleDateString()}
                {article.isReference && (
                  <span className="ml-auto text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                    手动添加
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredArticles.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              没有找到相关文章。
            </div>
          )}
        </div>
      </div>

      {/* View Article Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewingArticle.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                    {viewingArticle.topic}
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                    {viewingArticle.language}
                  </span>
                  <span>{new Date(viewingArticle.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingArticle(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
                  {viewingArticle.content}
                </div>
                {viewingArticle.chinese_translation && (
                  <>
                    <hr className="my-8 border-slate-200" />
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">中文翻译</h4>
                    <div className="whitespace-pre-wrap text-slate-700 font-sans leading-relaxed">
                      {viewingArticle.chinese_translation}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
