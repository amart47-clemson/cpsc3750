CPSC 3750 Exam 1 — Battleship
README
-----------------------------

Put the whole folder in htdocs and name it:

  battleship_exam

So you should have something like:

  /Applications/XAMPP/htdocs/battleship_exam/   (for Mac)

Inside that folder you need index.php, api.php, game.js, styles.css, README.txt, and AI_Reflection.pdf. The game state and scoreboard are saved as JSON in the server’s temp directory (so they work even if the app folder isn’t writable). You don’t have to create or edit any JSON files.


How to run it
-------------
1. Unzip the exam zip.
2. Copy the battleship_exam folder into your XAMPP htdocs folder.
3. Start Apache in XAMPP (you don’t need MySQL).
4. Open your browser and go to:  http://localhost/battleship_exam/

If Apache is on a different port (like 8080) then use:  http://localhost:8080/battleship_exam/

Place your ships, hit Start Battle, play. Use New Game to pick a difficulty and start over. When a game ends your result gets added to the scoreboard on the right.


What uses JSON (persistent storage)
-----------------------------------
Both of these use JSON files on the server:

1. Game state — saved as JSON in the server’s temp directory. Your current game survives a refresh and an Apache restart.

2. Scoreboard — saved the same way. When you win or lose, your name and that result get written there. The list you see on the page comes from that file, so it also survives refresh and restart.

No MySQL. No database. Just those two JSON files. The server creates them if they don’t exist, so you don’t have to do anything by hand.


Loom video
----------

  - https://www.loom.com/share/e425ecf8ad654f52950578d619a4e3a3 



Files in the folder
-------------------
  index.php    — main page (the game UI)
  api.php      — handles all the game and scoreboard logic
  game.js      — front-end (placement, firing, calling the API, scoreboard display)
  styles.css   — looks (radar theme, scoreboard, etc.)
  README.txt   — this file
  AI_Reflection.pdf  — reflection and prompt logs (export from AI_Reflection.md)

game-state.json and scoreboard.json are created when you run the game; they don’t need to be in your submission.
