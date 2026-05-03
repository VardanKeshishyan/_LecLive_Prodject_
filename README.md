# _LecLive_Project_

Web Application: https://leclive-prodject.onrender.com/

## About the web app

Lecture Legends is a web app that helps students turn lecture audio and slides into clear notes, summaries, and key points. It is made to help students review class content more easily, especially students with ADHD, dyslexia, or students who are deaf or hard of hearing. The app mainly uses Google Live API for real time interaction and Text-to-Speech to make the experience more accessible and easier to use.

## How to run it on your machine

Clone the repository to your computer, open it in your code editor, and install the dependencies with `npm install`. After that, create a `.env.local` file in the root of the project and add your Google Gemini API key there as `GEMINI_API_KEY=your_key_here`. Then start the development server with `npm run dev` and open `http://localhost:3000` in your browser.


## How to use it

Open the web app and start on the home page, where you can begin a session from the Start Session button. Before class, you can upload your lecture slides and choose accessibility preferences. During the lecture, the app listens in real time and turns the lecture into structured notes connected to the slides. You can use voice support to ask for things like repeating a key point, simplifying an idea, or reading something back aloud. After the session, you can review your notes, summaries, and other study material in a more organized way. 
