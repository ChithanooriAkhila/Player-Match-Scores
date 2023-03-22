const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("Server Running at http://localhost:6000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => ({
  playerId: dbObject.player_id,
  playerName: dbObject.player_name,
});

// ===============================API 1=================================================

app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const dbResponse = await db.all(query);
  const res = dbResponse.map((eachState) =>
    convertPlayerDbObjectToResponseObject(eachState)
  );
  response.send(res);
});
// ===============================API 2=================================================

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_details where player_id=${playerId};`;

  let dbResponse = await db.get(query);
  const { player_id, player_name } = dbResponse;
  let obj = {
    playerId: player_id,
    playerName: player_name,
  };
  response.send(obj);
});
// ===============================API 3=================================================
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const query = `
  update
   player_details 
  set 
  player_name='${playerName}'
    where player_id=${playerId}
  ;`;

  await db.run(query);
  response.send("Player Details Updated");
});
// ===============================API 4=================================================

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from match_details where match_id=${matchId};`;

  let dbResponse = await db.get(query);
  const { match_id, match, year } = dbResponse;
  let obj = {
    matchId: match_id,
    match: match,
    year: year,
  };
  response.send(obj);
});
// ===============================API 5=================================================

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from match_details where match_id in
  (select distinct match_id from player_match_score where player_id=${playerId});`;

  const dbResponse = await db.all(query);
  const res = dbResponse.map((obj) => ({
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  }));

  response.send(res);
});
// ===============================API 6=================================================

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from player_details where player_id in 
  (select distinct player_id from player_match_score where match_id=${matchId});`;

  const dbResponse = await db.all(query);
  const res = dbResponse.map((obj) => ({
    playerId: obj.player_id,
    playerName: obj.player_name,
  }));

  response.send(res);
});
// ===============================API 7=================================================

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `select player_id,sum(score) as totalScore,sum(fours) as totalFours,sum(sixes) as totalSixes from player_match_score where player_id=${playerId};
  `;
  const q2 = `select * from player_details where player_id=${playerId};`;

  const res = await db.get(q2);

  let dbResponse = await db.get(query);
  const { player_id, totalScore, totalFours, totalSixes } = dbResponse;
  const { player_name } = res;
  let obj = {
    playerId: player_id,
    playerName: player_name,
    totalScore: totalScore,
    totalFours: totalFours,
    totalSixes: totalSixes,
  };
  response.send(obj);
});

module.exports = app;
