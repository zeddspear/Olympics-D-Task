import fs from "fs";
import path from "path";
import {
  createPots,
  displayKnockoutResults,
  displayResults,
  drawQuarterFinals,
  Group,
  rankTeamsAcrossGroups,
  rankTeamsInGroups,
  simulateGroupStage,
  simulateKnockoutStage,
} from "./service/simulation";
import { calculateFormFactor, mapGroups } from "./utils/functionsToHelp";

const groupsFilePath = path.join(`${__dirname}`, "data", "groups.json");
const exhibitionsFilePath = path.join(__dirname, "data", "exhibitions.json");

const groupsData = JSON.parse(fs.readFileSync(groupsFilePath, "utf8"));
const exhibitionsData = JSON.parse(
  fs.readFileSync(exhibitionsFilePath, "utf8")
);

// exporting only all teams form factor
export const allTeamsFormFactors = calculateFormFactor(exhibitionsData);

// Main function
function main() {
  const mappedGroups: Group[] = mapGroups(groupsData);

  simulateGroupStage(mappedGroups);
  rankTeamsInGroups(mappedGroups);
  const rankedTeams = rankTeamsAcrossGroups(mappedGroups);
  displayResults(mappedGroups, rankedTeams);

  const pots = createPots(rankedTeams);
  const quarterFinals = drawQuarterFinals(pots);
  const knockoutStage = simulateKnockoutStage(quarterFinals);

  displayKnockoutResults(pots, knockoutStage);
}

main();
