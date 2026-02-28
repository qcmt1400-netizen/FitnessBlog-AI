import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateArticle(
  topic: string,
  language: string,
  additionalInstructions: string,
  referenceArticles: any[],
  signal?: AbortSignal
) {
  const referenceContext =
    referenceArticles.length > 0
      ? `请参考以下我们之前发表过的同类产品文章内容。在生成新文章时，请务必分析这些已有文章，**绝对不能出现和这些文章相似的内容、观点或段落**，必须提供全新的视角或侧重点：\n\n${referenceArticles.map((a) => `【标题】：${a.title}\n【内容】：${a.content}`).join("\n\n---\n\n")}`
      : "";

  const prompt = `
你是一位拥有丰富经验的家用健身器材领域专家与专栏作者。

任务：生成一篇关于家用健身器材的科普类文章。
主题：${topic}
输出语言：${language}

要求：
1. 文章的标题和正文必须自然融入产品类目单词：${topic}。注意：请将关键词自然融入，绝对不要使用 \`**\` (Markdown加粗) 标识关键词。
2. 单词数量控制在800到1000字左右。
3. 关键词（${topic}）占比控制在5%左右。
4. 文章结构必须严格包含：引言、5个左右的大标题（章节）加正文部分、总结。
5. 语言风格：偏学术风格，语言严谨、逻辑严密。不要乱讲话（不编造虚假信息），不要使用大白话，但文章大意必须保证普通消费者能够看懂。如需使用极度专业的术语，请附带简明解释。
6. ${referenceContext}
7. ${additionalInstructions}

除了生成目标语言（${language}）的文章外，你还需要：
1. 将生成的文章翻译成中文。
2. 检查生成的文章是否有乱写、逻辑不通的地方，并提供检查报告。
3. 列出你实际参考了哪些文章库中的文章标题。
`;

  const responsePromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: `文章标题（${language}）` },
          content: {
            type: Type.STRING,
            description: `文章正文（${language}），使用Markdown格式`,
          },
          chinese_translation: {
            type: Type.STRING,
            description: "文章的中文翻译，使用Markdown格式",
          },
          logic_check_notes: {
            type: Type.STRING,
            description: "逻辑检查报告（中文）",
          },
          referenced_library_articles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "实际参考的本地文章库中的文章标题列表",
          },
        },
        required: [
          "title",
          "content",
          "chinese_translation",
          "logic_check_notes",
          "referenced_library_articles",
        ],
      },
    },
  });

  return new Promise<any>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('AbortError'));
    
    const abortHandler = () => reject(new Error('AbortError'));
    signal?.addEventListener('abort', abortHandler);

    responsePromise.then(response => {
      signal?.removeEventListener('abort', abortHandler);
      if (!signal?.aborted) {
        const parsed = JSON.parse(response.text || '{}');
        
        const webReferences: any[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              webReferences.push({
                type: 'web',
                title: chunk.web.title,
                url: chunk.web.uri
              });
            }
          });
        }

        const libraryReferences = (parsed.referenced_library_articles || []).map((title: string) => ({
          type: 'library',
          title: title
        }));

        resolve({
          ...parsed,
          references: [...libraryReferences, ...webReferences]
        });
      }
    }).catch(err => {
      signal?.removeEventListener('abort', abortHandler);
      reject(err);
    });
  });
}

export async function reviseArticle(
  currentContent: string,
  currentTranslation: string,
  revisionRequest: string,
  history: { request: string; notes: string }[] = [],
  signal?: AbortSignal
) {
  const historyContext = history.length > 0
    ? `\n之前的修改历史：\n${history.map((h, i) => `[第${i + 1}次用户要求]: ${h.request}\n[第${i + 1}次AI说明]: ${h.notes}`).join('\n\n')}\n`
    : "";

  const prompt = `
你是一位拥有丰富经验的家用健身器材领域专家与专栏作者。
请根据用户的最新修改要求，修改以下文章及其翻译。
${historyContext}
当前文章内容：
${currentContent}

当前中文翻译：
${currentTranslation}

最新修改要求：
${revisionRequest}

注意：
1. 请将关键词自然融入，绝对不要使用 \`**\` (Markdown加粗) 标识关键词。
2. 必须保持原有的文章结构（引言、5个左右的大标题加正文、总结），即使根据要求修改，也绝对不要破坏或随意改变这个结构。
3. 语言风格需保持偏学术、严谨且逻辑清晰，不使用大白话，但要让普通用户能看懂。

请返回修改后的文章和翻译，并提供修改说明。
`;

  const responsePromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: {
            type: Type.STRING,
            description: "修改后的文章正文，使用Markdown格式",
          },
          chinese_translation: {
            type: Type.STRING,
            description: "修改后的中文翻译，使用Markdown格式",
          },
          revision_notes: {
            type: Type.STRING,
            description: "修改说明（中文）",
          },
        },
        required: ["content", "chinese_translation", "revision_notes"],
      },
    },
  });

  return new Promise<any>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('AbortError'));
    
    const abortHandler = () => reject(new Error('AbortError'));
    signal?.addEventListener('abort', abortHandler);

    responsePromise.then(response => {
      signal?.removeEventListener('abort', abortHandler);
      if (!signal?.aborted) {
        resolve(JSON.parse(response.text || '{}'));
      }
    }).catch(err => {
      signal?.removeEventListener('abort', abortHandler);
      reject(err);
    });
  });
}
