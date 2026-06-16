export interface Team {
  id: number;
  school_name: string;
  team_name: string;
}

export function generateGroups(
  teams: Team[],
  groupCount: number
) {
  const shuffled = [...teams].sort(
    () => Math.random() - 0.5
  );

  const groups: Team[][] = Array.from(
    { length: groupCount },
    () => []
  );

  for (const team of shuffled) {
    let placed = false;

    for (const group of groups) {
      const sameSchoolExists = group.some(
        (t) => t.school_name === team.school_name
      );

      if (!sameSchoolExists) {
        group.push(team);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const smallestGroup = groups.reduce((a, b) =>
        a.length <= b.length ? a : b
      );

      smallestGroup.push(team);
    }
  }

  return groups;
}