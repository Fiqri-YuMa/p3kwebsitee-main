'use client';

import { useState } from 'react';

interface School {
  id: number;
  school_name: string;
  team_count: number;
  category: string;
}

interface GeneratedGroups {
  [category: string]: string[][];
}

const getBaganName = (index: number) => {
  let name = '';
  let num = index;

  do {
    name =
      String.fromCharCode(65 + (num % 26)) +
      name;
    num = Math.floor(num / 26) - 1;
  } while (num >= 0);

  return name;
};

export default function KocokanPage() {
  const [schoolName, setSchoolName] = useState('');
  const [teamCount, setTeamCount] = useState(1);
  const [category, setCategory] = useState('Wira Putra');

  const [schools, setSchools] = useState<School[]>([]);
  const [groups, setGroups] =
    useState<GeneratedGroups>({});

  const [groupCount, setGroupCount] =
    useState(4);

  const handleAddSchool = () => {
    if (!schoolName.trim()) {
      alert('Nama sekolah wajib diisi');
      return;
    }

    const newSchool: School = {
      id: Date.now(),
      school_name: schoolName,
      team_count: teamCount,
      category,
    };

    setSchools((prev) => [...prev, newSchool]);

    setSchoolName('');
    setTeamCount(1);
    setCategory('Wira Putra');
  };

  const handleGenerate = () => {
    const categories = [
      'Wira Putra',
      'Wira Putri',
      'Madya Putra',
      'Madya Putri',
    ];

    const result: GeneratedGroups = {};

    categories.forEach((category) => {
      const categorySchools = schools.filter(
        (school) => school.category === category
      );

      type TeamData = {
        school: string;
        name: string;
      };

      const teams: TeamData[] = [];

      categorySchools.forEach((school) => {
        for (
          let i = 0;
          i < school.team_count;
          i++
        ) {
          const reguName =
            String.fromCharCode(65 + i);

          teams.push({
            school: school.school_name,
            name: `${school.school_name} - Regu ${reguName}`,
          });
        }
      });

      const shuffled = [...teams].sort(
        () => Math.random() - 0.5
      );

      const generatedGroups: string[][] =
        Array.from(
          { length: groupCount },
          () => []
        );

      shuffled.forEach((team) => {
        let placed = false;

        const availableGroups =
          generatedGroups
            .map((group, index) => ({
              index,
              group,
            }))
            .filter(
              ({ group }) =>
                !group.some((member) =>
                  member.includes(team.school)
                )
            );

        if (availableGroups.length > 0) {
          availableGroups.sort(
            (a, b) =>
              a.group.length -
              b.group.length
          );

          availableGroups[0].group.push(
            team.name
          );

          placed = true;
        }

        if (!placed) {
          let smallestIndex = 0;

          for (
            let i = 1;
            i < generatedGroups.length;
            i++
          ) {
            if (
              generatedGroups[i].length <
              generatedGroups[
                smallestIndex
              ].length
            ) {
              smallestIndex = i;
            }
          }

          generatedGroups[
            smallestIndex
          ].push(team.name);
        }
      });

      result[category] = generatedGroups;
    });

    setGroups(result);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Shuffle Lomba Tandu
      </h1>

      <div className="border rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Tambah Sekolah
        </h2>

        <input
          type="text"
          placeholder="Nama Sekolah"
          value={schoolName}
          onChange={(e) =>
            setSchoolName(e.target.value)
          }
          className="border p-2 rounded w-full mb-3"
        />

        <input
          type="number"
          min={1}
          value={teamCount}
          onChange={(e) =>
            setTeamCount(
              Number(e.target.value)
            )
          }
          className="border p-2 rounded w-full mb-3"
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="border p-2 rounded w-full mb-3"
        >
          <option>Wira Putra</option>
          <option>Wira Putri</option>
          <option>Madya Putra</option>
          <option>Madya Putri</option>
        </select>

        <button
          onClick={handleAddSchool}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Tambah Sekolah
        </button>
      </div>

      <div className="border rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Data Sekolah
        </h2>

        {schools.length === 0 ? (
          <p>Belum ada data.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  Sekolah
                </th>
                <th className="text-left p-2">
                  Jumlah Regu
                </th>
                <th className="text-left p-2">
                  Kategori
                </th>
              </tr>
            </thead>

            <tbody>
              {schools.map((school) => (
                <tr
                  key={school.id}
                  className="border-b"
                >
                  <td className="p-2">
                    {school.school_name}
                  </td>
                  <td className="p-2">
                    {school.team_count}
                  </td>
                  <td className="p-2">
                    {school.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border rounded-lg p-5 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Generate Bagan
        </h2>

        <input
          type="number"
          min={2}
          value={groupCount}
          onChange={(e) =>
            setGroupCount(
              Number(e.target.value)
            )
          }
          className="border p-2 rounded w-full mb-3"
          placeholder="Jumlah Bagan"
        />

        <button
          onClick={handleGenerate}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Generate
        </button>
      </div>

      {Object.keys(groups).length > 0 && (
        <div className="space-y-10">
          {Object.entries(groups).map(
            ([category, categoryGroups]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4">
                  {category}
                </h2>

                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(280px, 1fr))',
                  }}
                >
                  {categoryGroups.map(
                    (group, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4"
                      >
                        <h3 className="font-bold mb-3">
                          Bagan{' '}
                          {getBaganName(index)}
                        </h3>

                        {group.length === 0 ? (
                          <p className="text-gray-500">
                            Belum ada regu
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {group.map(
                              (
                                team,
                                idx
                              ) => (
                                <li key={idx}>
                                  • {team}
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}