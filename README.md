🧠 AI Resume Screener

An AI-powered web application that automatically screens and ranks resumes based on a given job description. This project helps recruiters and hiring teams quickly identify the most relevant candidates using Natural Language Processing (NLP).

🚀 Features

Upload and analyze multiple resumes

Provide a job description for comparison

Resume ranking based on skill and keyword matching

Simple and interactive web interface

Built using Python and Flask

🛠️ Tech Stack

Backend: Python, Flask

NLP: TF-IDF, Cosine Similarity

Frontend: HTML, CSS

Libraries: scikit-learn, pandas, nltk

📂 Project Structure
ai-resume-screener/
│
├── app.py                 # Main Flask application
├── resumes/               # Folder to store uploaded resumes
├── templates/
│   ├── index.html         # Home page
│   └── rank.html          # Resume ranking results
├── static/
│   └── style.css          # Styling
├── requirements.txt       # Python dependencies
└── README.md              # Project documentation

⚙️ Installation & Setup

Clone the repository

git clone https://github.com/your-username/ai-resume-screener.git
cd ai-resume-screener


Create a virtual environment (optional but recommended)

python -m venv venv
venv\Scripts\activate   # On Windows


Install dependencies

pip install -r requirements.txt


Run the application

python app.py


Open in browser

http://127.0.0.1:5000/
