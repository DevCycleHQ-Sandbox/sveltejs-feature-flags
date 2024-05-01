import "./global.css";

import App from "./App.svelte";

import { OpenFeature } from "@openfeature/web-sdk";

import Airtable from "airtable";

class AirtableProvider {
  constructor(apiKey, baseId) {
    this.metadata = { name: "Airtable Feature Provider" };
    this.base = new Airtable({ apiKey: apiKey }).base(baseId);
    this.airtableData = [];

    this.initialize = async function () {
      await new Promise((resolve, reject) => {
        this.base("Flags")
          .select()
          .eachPage(
            (records, fetchNextPage) => {
              this.airtableData = [...this.airtableData, ...records];
              fetchNextPage();
            },
            (error) => {
              if (error) {
                console.error(error);
                reject(false);
              } else {
                resolve();
              }
            }
          );
      });
    };

    this.queryFlag = function (flagKey) {
      const record = this.airtableData.find(
        (record) => record.fields.Name === flagKey
      );

      if (!record) {
        console.error("Flag not found:", flagKey);
        return null; // Return null if no record is found
      }

      return record.fields; // Return the flag fields if found
    };

    this.resolveBooleanEvaluation = function (flagKey, defaultValue) {
      const flag = this.queryFlag(flagKey);

      if (!flag) {
        return { value: defaultValue }; // Return default if flag not found
      }

      if (!flag.Enabled) {
        console.error("Flag disabled:", flagKey);
        return { value: defaultValue };
      }

      if (typeof flag.Value === "undefined") {
        flag.Value = false; // Treat undefined as false
      } else if (typeof flag.Value !== "boolean") {
        console.error("Flag not a boolean:", flagKey);
        return { value: defaultValue };
      }

      return {
        value: flag.Value, // Return the value since it is valid
      };
    };

    this.resolveStringEvaluation = function (flagKey, defaultValue) {
      const flag = this.queryFlag(flagKey);

      if (!flag) {
        return { value: defaultValue }; // Return default if flag not found
      }

      if (!flag.Enabled) {
        console.error("Flag disabled:", flagKey);
        return { value: defaultValue };
      }

      if (typeof flag.Value !== "string") {
        // Check if the value is not a string
        console.error("Expected a string value for flag:", flagKey);
        return { value: defaultValue };
      }

      return {
        value: flag.Value, // Return the value since it is valid
      };
    };

    this.resolveNumberEvaluation = function (flagKey, defaultValue) {
      const flag = this.queryFlag(flagKey);

      if (!flag) {
        return { value: defaultValue }; // Return default if flag not found
      }

      if (!flag.Enabled) {
        console.error("Flag disabled:", flagKey);
        return { value: defaultValue };
      }

      if (typeof flag.Value !== "number" || isNaN(flag.Value)) {
        // Check for a valid number, not NaN
        console.error("Expected a number value for flag:", flagKey);
        return { value: defaultValue };
      }

      return {
        value: flag.Value, // Return the value since it is valid
      };
    };

    this.resolveObjectEvaluation = function (flagKey, defaultValue) {
      const flag = this.queryFlag(flagKey);

      if (!flag) {
        return { value: defaultValue }; // Return default if flag not found
      }

      if (!flag.Enabled) {
        console.error("Flag disabled:", flagKey);
        return { value: defaultValue };
      }

      if (typeof flag.Value !== "object" || flag.Value === null) {
        // Ensure it is an object and not null
        console.error("Expected an object value for flag:", flagKey);
        return { value: defaultValue };
      }

      return {
        value: flag.Value, // Return the value since it is valid
      };
    };
  }
}

const airtableProvider = new AirtableProvider(
  process.env.ACCESS_TOKEN,
  process.env.BASE_ID
);

await OpenFeature.setProviderAndWait(airtableProvider);

const client = OpenFeature.getClient();

const app = new App({
  target: document.body,
});

export { app, client };
