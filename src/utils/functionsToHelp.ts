import { Group, Team } from "../service/simulation";
import { allTeamsFormFactors } from "../index";

type Match = {
  Date: string;
  Opponent: string;
  Result: string;
};

type TeamMatches = {
  [key: string]: Match[];
};

type TeamFormFactor = {
  name: string;
  formFactor: number;
};

export function calculateFormFactor(matches: TeamMatches): TeamFormFactor[] {
  const formFactors: TeamFormFactor[] = [];

  for (const team in matches) {
    let formFactor = 1;

    matches[team].forEach((match) => {
      const [teamScore, opponentScore] = match.Result.split("-").map(Number);

      if (teamScore > opponentScore) {
        formFactor += 0.1; // Win
      } else if (teamScore < opponentScore) {
        formFactor -= 0.1; // Loss
      }
      // No action needed for a draw as it contributes 0
    });

    formFactors.push({
      name: team,
      formFactor,
    });
  }

  return formFactors;
}

export const mapGroups = (data: any[]): Group[] => {
  return Object.entries(data).map(([groupName, teams]) => ({
    name: groupName,
    teams: teams.map((team: any) => ({
      name: team.Team,
      isoCode: team.ISOCode,
      fibaRanking: team.FIBARanking,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsScored: 0,
      pointsAllowed: 0,
      headToHeadResults: new Map(),
      formFactor: allTeamsFormFactors.find((fac) => fac.name === team.ISOCode)
        .formFactor,
    })),
    matches: [],
  }));
};

// Compare head-to-head results between two teams
function compareHeadToHead(teamA: Team, teamB: Team): number {
  const resultA = teamA.headToHeadResults.get(teamB.name);
  const resultB = teamB.headToHeadResults.get(teamA.name);

  if (resultA === "win" && resultB === "loss") return -1;
  if (resultA === "loss" && resultB === "win") return 1;
  if (resultA === "draw" && resultB === "draw") return 0;

  // If there is no clear result or both teams won against each other, or there are other results, consider it a tie
  return 0;
}

export const compareTeams = (a: Team, b: Team) => {
  const pointsA = a.wins * 2 + a.draws;
  const pointsB = b.wins * 2 + b.draws;
  const pointDiffA = a.pointsScored - a.pointsAllowed;
  const pointDiffB = b.pointsScored - b.pointsAllowed;

  // Primary sort by points
  if (pointsA !== pointsB) return pointsB - pointsA;

  // Secondary sort by point difference
  if (pointDiffA !== pointDiffB) return pointDiffB - pointDiffA;

  // Handle head-to-head results if points are still the same
  const headToHeadComparison = compareHeadToHead(a, b);
  if (headToHeadComparison !== 0) return headToHeadComparison;

  // Final fallback (though ideally, there should be a decisive result)
  return 0;
};
