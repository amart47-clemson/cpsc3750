# Exam 1 — AI Reflection

**Name:** [Replace with your full name]

---

## Part 1 — Favorite Feature I Already Had

### The feature: Saving the game to a JSON file

**What it does:**  
Whenever something in the game changes (you place ships, fire, the computer takes a turn, etc.), the server writes the whole game to a file called game-state.json. So if you close the browser or even restart Apache, when you come back the game is still there instead of resetting.

**Why I picked this one:**  
I liked that it was the one that actually saved stuff to the server. A lot of the other stuff is just UI or rules, but this one is what makes the game “stick” and it’s the kind of thing the exam was asking for with persistence.

**Where the state actually lives:**  
The real game state is on the server—in memory while the game is running, and in game-state.json on disk. The browser only has whatever the server last sent it so it can draw the grids. The browser doesn’t own the game; it just shows it and sends clicks to the server.

**How I used AI to build it:**  
I told the AI I wanted the game to survive a server restart using a JSON file. It suggested saving after every move and loading the file when the server starts. I said okay and it wrote the save/load code and hooked it into the endpoints.

**How my prompts changed:**  
First I just asked for “persistent storage so the game survives server restart.” After it added the JSON file, I asked what happens if the file doesn’t exist yet—I didn’t want it to crash. So we added a check and a default game. When we moved to PHP for the exam I asked to do the same thing there: one JSON file, load on startup, save after every change.

**What I did myself:**  
In the Node version I put game-state.json in .gitignore so I wasn’t committing my test games. In the PHP version I double-checked that the file path uses the script folder and that we create a valid game (with enemy ships placed) when the file is missing.

**Prompt log (short):**

- *“Implement persistent storage (JSON) so the game survives server restart.”*  
  I needed to meet the persistence requirement. The AI added save and load and called save after each endpoint. I didn’t have to change anything.

- *“What if the file doesn’t exist?”*  
  I wanted to avoid errors. It used the project directory and created a default game. I added game-state.json to .gitignore.

- *“Port to PHP for XAMPP and keep game state in JSON.”*  
  For the exam. It gave me api.php with the same idea. I checked the path and that we place enemy ships when the file is empty.

---

## Part 2 — New Feature 1: Scoreboard (JSON)

### What it does

When a game ends (you win or lose), the game sends your name and whether you won or lost to the server. The server keeps a list of names and their wins/losses in a file called scoreboard.json. The list shows up in a panel on the right. If you refresh the page or restart Apache, the list is still there because it’s in the file.

### Where the state lives

Everything is on the server in scoreboard.json. The page just asks for the list when it loads and again after a game ends, and it sends a new result when you finish a game. The browser doesn’t keep its own copy of the scoreboard.

### How I asked the AI / what went wrong / what I did

- *“Add a scoreboard that saves wins and losses per player name in a JSON file and shows it on the page.”*  
  I needed one feature that used persistent storage. The first version the AI wrote would overwrite the whole file with one new row, so old scores disappeared. I said to update the existing player’s wins or losses, or add a new player, and then save the whole list. It fixed it.

- I also made sure that if scoreboard.json doesn’t exist yet we start with an empty list and create the file when we first save.

- In game.js I added the code that runs when the game ends: it sends the player name and win or loss to the server, then fetches the scoreboard again so the panel updates. In index.php I added the text box for the name and the scoreboard list; in the CSS I styled that panel.

---

## Part 2 — New Feature 2: Difficulty (Easy / Medium / Hard)

### What it does

You pick Easy, Medium, or Hard from a dropdown (I put it in the header). When you click New Game, that choice gets sent to the server and stored with the game. Easy means the computer just shoots randomly. Medium and Hard use the “hunt” behavior—after it hits you it tries the cells next to that hit. You can only change the dropdown when you’re in setup (before or right after New Game), not in the middle of a game.

### Where the state lives

The difficulty is part of the same game state that we already save in game-state.json. So it’s on the server with everything else. The page just sends the dropdown value when you start a new game and gets it back from the server so it can show and disable the dropdown correctly.

### How I asked the AI / what I did

- *“Add difficulty levels: Easy, Medium, Hard. Easy is random only, Medium and Hard use hunt/target. Save it in game state.”*  
  I wanted a second feature that actually used state. The AI added a difficulty field and had Easy skip the target queue. I added a default of medium when we load old game state that doesn’t have difficulty yet.

- *“Don’t let them change difficulty in the middle of a game.”*  
  So the UI doesn’t get confusing. The server already sent back the current difficulty; I had to disable the dropdown in the JS when we’re not in the setup phase, and when we call New Game I send the current value from the dropdown.

---

Turn this into a PDF (AI_Reflection.pdf) and put it in your zip with the rest of the project.
