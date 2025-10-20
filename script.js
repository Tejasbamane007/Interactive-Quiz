// ====================
// Gemini-powered Quiz Generator
// ====================

const API_KEY = "AIzaSyDmq1K3Kfy6P8HzcHIbXNlLsT9HlPj-D6k"; 

// Fetch random quiz questions from Gemini
async function fetchQuestions() {
  const prompt = `
  Generate 5 random multiple-choice quiz questions on any general topic.
  Respond ONLY in JSON format as an array of objects like this:
  [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string"
    }
  ]
  `.trim();

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" +
        API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-goog-api-client": "interactive-quiz/1.0",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }], role: "user" }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4,
                  },
                  answer: { type: "string" },
                },
                required: ["question", "options", "answer"],
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("Error fetching questions:", err);
    alert("Failed to load questions. Please check your API key or network.");
    return [];
  }
}

// ====================
// Quiz Logic
// ====================

let questions = [];
let score = 0;
let timeLeft = 60;
let timerInterval;

// DOM Elements
const quizForm = document.getElementById("quiz-form");
const quizQuestionsDiv = document.getElementById("quiz-questions");
const progressDiv = document.getElementById("progress");
const timerDiv = document.getElementById("timer");
const resultDiv = document.getElementById("result");
const scoreDiv = document.getElementById("score");
const analysisDiv = document.getElementById("analysis");
const restartBtn = document.getElementById("restart-btn");

// Load questions dynamically
async function loadQuestions() {
  quizQuestionsDiv.innerHTML = "<p>Loading quiz...</p>";
  questions = await fetchQuestions();

  if (!questions.length) {
    quizQuestionsDiv.innerHTML = "<p>Couldn't load quiz. Try again later.</p>";
    return;
  }

  quizQuestionsDiv.innerHTML = "";
  questions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    const questionText = document.createElement("h3");
    questionText.textContent = `${index + 1}. ${q.question}`;
    questionDiv.appendChild(questionText);

    const optionsDiv = document.createElement("div");
    optionsDiv.classList.add("options");

    q.options.forEach(option => {
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question${index}`;
      input.value = option;
      input.id = `q${index}_${option}`;

      const label = document.createElement("label");
      label.setAttribute("for", input.id);
      label.textContent = option;

      optionsDiv.appendChild(input);
      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);
    quizQuestionsDiv.appendChild(questionDiv);
  });

  progressDiv.textContent = `Question 1 of ${questions.length}`;
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

// Submit quiz
function submitQuiz() {
  clearInterval(timerInterval);
  score = 0;
  analysisDiv.innerHTML = "";

  questions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="question${index}"]:checked`);
    if (selected) {
      if (selected.value === q.answer) {
        score++;
        analysisDiv.innerHTML += `<p>Q${index + 1}: ✅ Correct (${q.answer})</p>`;
      } else {
        analysisDiv.innerHTML += `<p>Q${index + 1}: ❌ Wrong (Your Answer: ${selected.value}, Correct: ${q.answer})</p>`;
      }
    } else {
      analysisDiv.innerHTML += `<p>Q${index + 1}: ⚠️ Not Answered (Correct: ${q.answer})</p>`;
    }
  });

  scoreDiv.textContent = `${score} / ${questions.length}`;
  resultDiv.classList.remove("hidden");
  quizForm.classList.add("hidden");
}

// Restart quiz
restartBtn.addEventListener("click", () => {
  score = 0;
  timeLeft = 60;
  resultDiv.classList.add("hidden");
  quizForm.classList.remove("hidden");
  loadQuestions();
  startTimer();
});

// Handle form submit
quizForm.addEventListener("submit", e => {
  e.preventDefault();
  submitQuiz();
});

// Initialize
loadQuestions().then(startTimer);
