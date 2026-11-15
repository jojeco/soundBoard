import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import * as SQLite from "expo-sqlite";

// Read-only view of app/Custom.js's `sounds` table, so the Premade screen's
// combos can also reference custom recordings (see NEXT.md, "Combos for
// custom recordings"). Opens the same DB/table app/Custom.js uses
// ("soundboard.db", `select * from sounds`) but never creates, alters, or
// deletes anything — Custom.js owns the schema and all writes.
//
// expo-router 3.4.6 (this repo's installed version, see package.json) does
// export useFocusEffect itself (confirmed via its build/exports.d.ts), so
// this refetches on every screen focus rather than falling back to a
// mount-only effect. Its own source wraps a plain useEffect with
// `[effect, navigation]` deps, so the callback MUST be wrapped in
// useCallback — an inline arrow would be a new reference every render,
// re-running the effect (and re-fetching) in a tight loop while focused.
export default function useCustomSoundRows() {
  const [rows, setRows] = useState([]);

  const fetchRows = useCallback(() => {
    try {
      const db = SQLite.openDatabase("soundboard.db");
      db.transaction(
        (tx) => {
          tx.executeSql(
            "select * from sounds",
            [],
            (_, { rows: { _array } }) => setRows(_array),
            () => {
              // Missing table (e.g. fresh install before Custom.js has ever
              // mounted) or a bad query — fall back to no custom sounds.
              setRows([]);
              return false;
            }
          );
        },
        () => setRows([])
      );
    } catch (e) {
      setRows([]);
    }
  }, []);

  useFocusEffect(fetchRows);

  return rows;
}
