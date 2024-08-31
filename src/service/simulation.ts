import { compareTeams } from "../utils/functionsToHelp";

export interface Team {
  name: string;
  isoCode: string;
  fibaRanking: number;
  wins: number;
  losses: number;
  draws: number;
  pointsScored: number;
  pointsAllowed: number;
  group: string;
  headToHeadResults: Map<string, "win" | "draw" | "loss">; // Map of head-to-head results against other teams
  formFactor: number;
}

export interface MatchResult {
  team1: Team;
  team2: Team;
  score1: number;
  score2: number;
}

export interface Group {
  name: string;
  teams: Team[];
  matches: MatchResult[];
}

export interface Pot {
  name: string;
  teams: Team[];
}

export interface KnockoutStage {
  quarterFinals: MatchResult[];
  semiFinals: MatchResult[];
  thirdPlace: MatchResult | null;
  final: MatchResult | null;
}

// Simulate match which will return us match scores
function simulateMatch(team1: Team, team2: Team): MatchResult {
  // Calculate the probability of team1 winning based on ranking and form factor

  const rankingDiff = team1.fibaRanking - team2.fibaRanking;
  const formFactorDiff = team1.formFactor - team2.formFactor;
  const probTeam1Wins = 0.5 + (rankingDiff + formFactorDiff * 10) / 100;

  let score1: number;
  let score2: number;

  // Determine the match result
  if (Math.random() < probTeam1Wins) {
    score1 = Math.floor(Math.random() * 21) + 80;
    score2 = Math.floor(Math.random() * (score1 - 70)) + 70;
    team1.formFactor += 0.1; // Increment formFactor for winning team
    team2.formFactor -= 0.1; // Decrement formFactor for losing team
  } else {
    score2 = Math.floor(Math.random() * 21) + 80;
    score1 = Math.floor(Math.random() * (score2 - 70)) + 70;
    team2.formFactor += 0.1; // Increment formFactor for winning team
    team1.formFactor -= 0.1; // Decrement formFactor for losing team
  }

  // Ensure formFactor stays within a reasonable range
  team1.formFactor = Math.max(0, Math.min(2, team1.formFactor));
  team2.formFactor = Math.max(0, Math.min(2, team2.formFactor));

  return {
    team1,
    team2,
    score1,
    score2,
  };
}

// Simulate group stage iterate over all the groups in the groups array and simulate matches btw two teams
function simulateGroupStage(groups: Group[]): void {
  groups.forEach((group) => {
    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        const match = simulateMatch(group.teams[i], group.teams[j]);
        group.matches.push(match);

        // Update teams' records
        if (match.score1 > match.score2) {
          group.teams[i].wins++;
          group.teams[j].losses++;
          group.teams[i].headToHeadResults.set(group.teams[j].name, "win");
          group.teams[j].headToHeadResults.set(group.teams[i].name, "loss");
        } else if (match.score1 === match.score2) {
          group.teams[i].draws++;
          group.teams[j].draws++;
          group.teams[i].headToHeadResults.set(group.teams[j].name, "draw");
          group.teams[j].headToHeadResults.set(group.teams[i].name, "draw");
        } else {
          group.teams[j].wins++;
          group.teams[i].losses++;
          group.teams[i].headToHeadResults.set(group.teams[j].name, "loss");
          group.teams[j].headToHeadResults.set(group.teams[i].name, "win");
        }

        group.teams[i].pointsScored += match.score1;
        group.teams[i].pointsAllowed += match.score2;
        group.teams[j].pointsScored += match.score2;
        group.teams[j].pointsAllowed += match.score1;
      }
    }
  });
}

//Rank teams within the groups according to their points
function rankTeamsInGroups(groups: Group[]): void {
  groups.forEach((group) => {
    // Sort teams within the group
    group.teams.sort((a, b) => compareTeams(a, b));
  });
}

function rankTeamsAcrossGroups(groups: Group[]): Team[] {
  const firstPlaceTeams: Team[] = [];
  const secondPlaceTeams: Team[] = [];
  const thirdPlaceTeams: Team[] = [];

  groups.forEach((group) => {
    firstPlaceTeams.push({ ...group.teams[0], group: group.name });
    secondPlaceTeams.push({ ...group.teams[1], group: group.name });
    thirdPlaceTeams.push({ ...group.teams[2], group: group.name });
  });

  const rankTeams = (teams: Team[]) => teams.sort((a, b) => compareTeams(a, b));

  rankTeams(firstPlaceTeams);
  rankTeams(secondPlaceTeams);
  rankTeams(thirdPlaceTeams);

  return [...firstPlaceTeams, ...secondPlaceTeams, ...thirdPlaceTeams];
}

function createPots(rankedTeams: Team[]): Pot[] {
  const pots: Pot[] = [
    { name: "Pot D", teams: [rankedTeams[0], rankedTeams[1]] },
    { name: "Pot E", teams: [rankedTeams[2], rankedTeams[3]] },
    { name: "Pot F", teams: [rankedTeams[4], rankedTeams[5]] },
    { name: "Pot G", teams: [rankedTeams[6], rankedTeams[7]] },
  ];

  return pots;
}

//Drawing quater final teams and match would not be btw the same groups teams
function drawQuarterFinals(pots: Pot[]): MatchResult[] {
  const quarterFinals: MatchResult[] = [];

  const potD = [...pots[0].teams];
  const potE = [...pots[1].teams];
  const potF = [...pots[2].teams];
  const potG = [...pots[3].teams];

  const swapTeamsIfNeeded = (pot1: Team[], pot2: Team[]): void => {
    for (let i = 0; i < pot1.length; i++) {
      if (pot1[i].group === pot2[i].group) {
        // Try to swap with another team from pot2
        for (let j = 0; j < pot2.length; j++) {
          if (
            pot1[i].group !== pot2[j].group &&
            pot1[j].group !== pot2[i].group
          ) {
            [pot2[i], pot2[j]] = [pot2[j], pot2[i]];
            break;
          }
        }
      }
    }
  };

  const matchTeams = (pot1: Team[], pot2: Team[]): void => {
    swapTeamsIfNeeded(pot1, pot2);

    quarterFinals.push({
      team1: pot1[0],
      team2: pot2[0],
      score1: 0,
      score2: 0,
    });

    quarterFinals.push({
      team1: pot1[1],
      team2: pot2[1],
      score1: 0,
      score2: 0,
    });
  };

  matchTeams(potD, potG);
  matchTeams(potE, potF);

  return quarterFinals;
}

function simulateKnockoutStage(quarterFinals: MatchResult[]): KnockoutStage {
  const simulateMatch = (match: MatchResult): MatchResult => {
    let score1 =
      Math.floor(Math.random() * 21 + Number(match.team1.formFactor * 10)) + 80;
    let score2 =
      Math.floor(Math.random() * 21 + Number(match.team2.formFactor * 10)) + 80;

    // Shootouts for a tie during knockout stages
    while (score1 === score2) {
      score1 = Math.floor(Math.random() * 21) + 80;
      score2 = Math.floor(Math.random() * 21) + 80;
    }

    match.score1 = score1;
    match.score2 = score2;

    // Determine the winner and update form factors
    if (score1 > score2) {
      match.team1.formFactor += 0.1; // Increment formFactor for the winning team
      match.team2.formFactor -= 0.1; // Decrement formFactor for the losing team
    } else {
      match.team2.formFactor += 0.1; // Increment formFactor for the winning team
      match.team1.formFactor -= 0.1; // Decrement formFactor for the losing team
    }

    // Ensure formFactor stays within a reasonable range (e.g., between 0 and 2)
    match.team1.formFactor = Math.max(0, Math.min(2, match.team1.formFactor));
    match.team2.formFactor = Math.max(0, Math.min(2, match.team2.formFactor));

    return match;
  };

  const semiFinals: MatchResult[] = [];
  const quarterFinalsResult: MatchResult[] = [];
  const quaterFinalsWinners: Team[] = [];

  quarterFinals.forEach((match) => {
    const result = simulateMatch(match);
    quarterFinalsResult.push(result);
    const winner = result.score1 > result.score2 ? result.team1 : result.team2;
    quaterFinalsWinners.push(winner);
  });

  const Semifinal1 = simulateMatch({
    team1: quaterFinalsWinners[0],
    team2: quaterFinalsWinners[2],
    score1: 0,
    score2: 0,
  });

  const Semifinal2 = simulateMatch({
    team1: quaterFinalsWinners[1],
    team2: quaterFinalsWinners[3],
    score1: 0,
    score2: 0,
  });

  semiFinals.push(...[Semifinal1, Semifinal2]);

  const finalist1 =
    Semifinal1.score1 > Semifinal1.score2 ? Semifinal1.team1 : Semifinal1.team2;
  const finalist2 =
    Semifinal2.score1 > Semifinal2.score2 ? Semifinal2.team1 : Semifinal2.team2;
  const thirdPlaceTeam1 =
    Semifinal1.score1 > Semifinal1.score2 ? Semifinal1.team2 : Semifinal1.team1;
  const thirdPlaceTeam2 =
    Semifinal2.score1 > Semifinal2.score2 ? Semifinal2.team2 : Semifinal2.team1;

  const finalMatch = simulateMatch({
    team1: finalist1,
    team2: finalist2,
    score1: 0,
    score2: 0,
  });

  const thirdPlaceMatch = simulateMatch({
    team1: thirdPlaceTeam1,
    team2: thirdPlaceTeam2,
    score1: 0,
    score2: 0,
  });

  return {
    quarterFinals: quarterFinalsResult,
    semiFinals: semiFinals,
    thirdPlace: thirdPlaceMatch,
    final: finalMatch,
  };
}

function displayResults(groups: Group[], rankedTeams: Team[]): void {
  console.log("Group Stage - Results:");

  groups.forEach((group) => {
    console.log(`\nGroup ${group.name}:`);
    group.matches.forEach((match) => {
      console.log(
        `${match.team1.isoCode} ${match.score1} : ${match.score2} ${match.team2.isoCode}`
      );
    });
  });

  console.log("\nFinal Group Standings:");
  groups.forEach((group) => {
    console.log(`\nGroup ${group.name}:`);
    group.teams.forEach((team, index) => {
      const pointDiff = team.pointsScored - team.pointsAllowed;
      console.log(
        `${index + 1}. ${team.name} (Wins: ${team.wins}, Losses: ${
          team.losses
        }, Draws:${team.draws}, Points Scored: ${
          team.pointsScored
        }, Points Allowed: ${
          team.pointsAllowed
        }, Point Difference: ${pointDiff})`
      );
    });
  });

  console.log("\nTeams Advancing to Knockout Stage:");
  rankedTeams.slice(0, 8).forEach((team, index) => {
    console.log(`${index + 1}. ${team.name}`);
  });

  const eliminatedTeam = rankedTeams[8];
  console.log(`\nEliminated Team: ${eliminatedTeam.name}`);
}

function displayKnockoutResults(
  pots: Pot[],
  knockoutStage: KnockoutStage
): void {
  console.log("Pots:");
  pots.forEach((pot) => {
    console.log(
      `${pot.name}: ${pot.teams.map((team) => team.name).join(", ")}`
    );
  });

  console.log("\nKnockout Stage:");

  console.log("\nQuarter-Finals:");
  knockoutStage.quarterFinals.forEach((match) => {
    console.log(
      `${match.team1.name} - ${match.team2.name} (${match.score1}:${match.score2})`
    );
  });

  console.log("\nSemi-Finals:");
  knockoutStage?.semiFinals?.forEach((match) => {
    console.log(
      `${match?.team1?.name} - ${match?.team2?.name} (${match?.score1}:${match?.score2})`
    );
  });

  console.log("\nThird-Place Match:");
  if (knockoutStage.thirdPlace) {
    console.log(
      `${knockoutStage.thirdPlace.team1.name} - ${knockoutStage.thirdPlace.team2.name} (${knockoutStage.thirdPlace.score1}:${knockoutStage.thirdPlace.score2})`
    );
  }

  console.log("\nFinal:");
  if (knockoutStage.final) {
    console.log(
      `${knockoutStage.final.team1.name} - ${knockoutStage.final.team2.name} (${knockoutStage.final.score1}:${knockoutStage.final.score2})`
    );
  }

  const first =
    knockoutStage.final.score1 > knockoutStage.final.score2
      ? knockoutStage.final.team1
      : knockoutStage.final.team2;
  const second =
    knockoutStage.final.score1 > knockoutStage.final.score2
      ? knockoutStage.final.team2
      : knockoutStage.final.team1;

  const third =
    knockoutStage.thirdPlace.score1 > knockoutStage.thirdPlace.score2
      ? knockoutStage.thirdPlace.team1
      : knockoutStage.thirdPlace.team2;

  console.log("\nMedals:");
  if (knockoutStage.final) {
    console.log(`1st: ${first.name}`);
    console.log(`2nd: ${second.name}`);
  }
  if (third) {
    console.log(`3rd: ${third.name}`);
  }
}

export {
  simulateGroupStage,
  rankTeamsInGroups,
  rankTeamsAcrossGroups,
  displayResults,
  createPots,
  drawQuarterFinals,
  simulateKnockoutStage,
  displayKnockoutResults,
};
