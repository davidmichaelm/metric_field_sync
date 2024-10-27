import {
  initializeBlock,
  useBase,
  useRecords,
  Button,
} from "@airtable/blocks/ui";
import React from "react";
import styles from "./MetricFieldSync.module.css";
import { FieldType, Table, Record } from "@airtable/blocks/models";

function MetricFieldSync() {
  const base = useBase();

  const metricTable = base.getTableByName("Metrics");
  const metricRecords = useRecords(metricTable);

  const checkInFormTable = base.getTableByName("Check-In Form");

  return (
    <div className={styles["container"]}>
      <div>
        <Button
          onClick={async () =>
            await syncMetricFields(checkInFormTable, metricRecords)
          }
        >
          Sync Metric Fields
        </Button>
      </div>
      <div>
        Clicking the button above will add any status or comments fields missing
        to the "Check-In Form" table.
      </div>
      <table className={styles["table"]}>
        <thead>
          <th>Metric</th>
          <th>Metric Id</th>
          <th>Has status field</th>
          <th>Has comments field</th>
        </thead>
        <tbody>
          {metricRecords.map((metric) => {
            const metricId = metric.getCellValue("Id");
            const hasStatusField = checkInFormTable.fields.find(
              (field) => field.name === `${metricId}_status`
            );
            const hasCommentsField = checkInFormTable.fields.find(
              (field) => field.name === `${metricId}_comments`
            );

            return (
              <tr>
                <td>{metric.name}</td>
                <td className={styles["center"]}>{metricId}</td>
                <td className={styles["center"]}>
                  {hasStatusField ? "✅" : "❌"}
                </td>
                <td className={styles["center"]}>
                  {hasCommentsField ? "✅" : "❌"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function syncMetricFields(
  checkInFormTable: Table,
  metricRecords: Record[]
) {
  const findMissingFields = buildMissingFieldFinder(
    metricRecords,
    checkInFormTable
  );

  const missingStatusFields = findMissingFields("_status");
  const missingCommentsFields = findMissingFields("_comments");

  for (const metric of metricRecords) {
    const metricId = metric.getCellValue("Id") as string;
    if (missingStatusFields.includes(metricId)) {
      await checkInFormTable.createFieldAsync(
        `${metricId}_status`,
        FieldType.SINGLE_SELECT,
        {
          choices: [
            {
              name: "Planting",
              color: "yellowDark1",
            },
            {
              name: "Growing",
              color: "greenBright",
            },
            {
              name: "Harvesting",
              color: "purpleDark1",
            },
          ],
        }
      );
    }
    if (missingCommentsFields.includes(metricId)) {
      await checkInFormTable.createFieldAsync(
        `${metricId}_comments`,
        FieldType.MULTILINE_TEXT
      );
    }
  }
}

function buildMissingFieldFinder(
  metricRecords: Record[],
  checkInFormTable: Table
) {
  function findMissingFields(fieldPostfix: string) {
    return metricRecords
      .filter((metric) => {
        const metricId = metric.getCellValue("Id");

        return !checkInFormTable.fields.find(
          (field) => field.name === `${metricId}${fieldPostfix}`
        );
      })
      .map((metric) => metric.getCellValue("Id") as string);
  }

  return findMissingFields;
}

initializeBlock(() => <MetricFieldSync />);
