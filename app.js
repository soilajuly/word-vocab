const STORAGE_KEY = "word-between-vocabulary";

const form = document.querySelector("#word-form");
const wordInput = document.querySelector("#word-input");
const meaningInput = document.querySelector("#meaning-input");
const formTitle = document.querySelector("#form-title");
const submitLabel = document.querySelector("#submit-label");
const cancelEditButton = document.querySelector("#cancel-edit");
const formMessage = document.querySelector("#form-message");
const searchInput = document.querySelector("#search-input");
const wordList = document.querySelector("#word-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const totalCount = document.querySelector("#total-count");
const recentWord = document.querySelector("#recent-word");
const listCount = document.querySelector("#list-count");

let words = loadWords();
let editingId = null;

function loadWords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError("单词本数据格式无效");
    return parsed.filter((item) => item && typeof item.id === "string" && typeof item.word === "string" && typeof item.meaning === "string" && typeof item.createdAt === "number");
  } catch (error) {
    console.error("读取本地单词本失败：", error);
    window.addEventListener("DOMContentLoaded", () => showMessage("无法读取之前保存的单词，请检查浏览器存储设置。"), { once: true });
    return [];
  }
}

function persistWords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return true;
  } catch (error) {
    console.error("保存本地单词本失败：", error);
    showMessage("保存失败，请检查浏览器的本地存储空间或权限。");
    return false;
  }
}

function showMessage(message = "") { formMessage.textContent = message; }

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "收藏一个新词";
  submitLabel.textContent = "收进单词本";
  cancelEditButton.hidden = true;
  showMessage();
}

function startEditing(entry) {
  editingId = entry.id;
  wordInput.value = entry.word;
  meaningInput.value = entry.meaning;
  formTitle.textContent = "修改这个词";
  submitLabel.textContent = "保存修改";
  cancelEditButton.hidden = false;
  showMessage();
  document.querySelector("#add-section").scrollIntoView({ behavior: "smooth", block: "center" });
  wordInput.focus({ preventScroll: true });
}

function createWordCard(entry) {
  const card = document.createElement("article");
  card.className = "word-card";
  const initial = document.createElement("span");
  initial.className = "word-initial";
  initial.setAttribute("aria-hidden", "true");
  initial.textContent = Array.from(entry.word)[0].toUpperCase();
  const content = document.createElement("div");
  content.className = "word-content";
  const title = document.createElement("h3");
  title.className = "word-title";
  title.textContent = entry.word;
  const meaning = document.createElement("p");
  meaning.className = "word-meaning";
  meaning.textContent = entry.meaning;
  content.append(title, meaning);
  const actions = document.createElement("div");
  actions.className = "word-actions";
  const editButton = document.createElement("button");
  editButton.className = "icon-button";
  editButton.type = "button";
  editButton.setAttribute("aria-label", `编辑 ${entry.word}`);
  editButton.title = "编辑";
  editButton.textContent = "✎";
  editButton.addEventListener("click", () => startEditing(entry));
  const deleteButton = document.createElement("button");
  deleteButton.className = "icon-button delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `删除 ${entry.word}`);
  deleteButton.title = "删除";
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => deleteWord(entry.id));
  actions.append(editButton, deleteButton);
  card.append(initial, content, actions);
  return card;
}

function render() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visibleWords = words.filter((entry) => entry.word.toLocaleLowerCase().includes(query) || entry.meaning.toLocaleLowerCase().includes(query));
  wordList.replaceChildren(...visibleWords.map(createWordCard));
  emptyState.hidden = visibleWords.length > 0;
  emptyTitle.textContent = words.length === 0 ? "你的单词本还是空的" : "没有找到匹配的单词";
  emptyDescription.textContent = words.length === 0 ? "记下第一个新词，让这段学习旅程从这里开始。" : "试试其他单词或释义，或者收藏一个新词。";
  totalCount.textContent = String(words.length);
  listCount.textContent = String(visibleWords.length);
  recentWord.textContent = words.length > 0 ? words[0].word : "还没有单词";
}

function deleteWord(id) {
  const previousWords = words;
  words = words.filter((entry) => entry.id !== id);
  if (!persistWords()) { words = previousWords; return; }
  if (editingId === id) resetForm();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();
  if (!word || !meaning) { showMessage("请填写单词和释义。"); return; }
  const duplicate = words.some((entry) => entry.id !== editingId && entry.word.toLocaleLowerCase() === word.toLocaleLowerCase());
  if (duplicate) { showMessage("这个单词已经在单词本里了，可以直接编辑它。"); return; }
  const previousWords = words;
  if (editingId) {
    words = words.map((entry) => entry.id === editingId ? { ...entry, word, meaning } : entry);
  } else {
    words = [{ id: crypto.randomUUID(), word, meaning, createdAt: Date.now() }, ...words];
  }
  if (!persistWords()) { words = previousWords; return; }
  resetForm();
  render();
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});
render();
