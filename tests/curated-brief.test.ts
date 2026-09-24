import assert from "node:assert/strict";
import test from "node:test";
import registryData from "../data/projects.json";
import {
  buildCuratedBriefContent,
  buildReportProjects,
  type ReportProjectRecord,
} from "../worker/curated-brief";

const registry = registryData as { projects: ReportProjectRecord[] };
const project = registry.projects.find((item) => item.slug === "arancia-yards-2-beyond-city-of-arabia-dubai");
if (!project) throw new Error("Valuation test project is missing.");

test("recalculates unit, rent, occupancy and payment figures from advisor inputs", () => {
  const [result] = buildReportProjects([project], [{
    slug: project.slug,
    bedroom: "2BR",
    unitReference: "2BR scenario",
    unitPrice: 2_250_000,
    unitAreaSqft: 1_180,
    annualRent: 155_000,
    annualRentLow: 140_000,
    annualRentHigh: 170_000,
    occupancyRate: 95,
    serviceChargePerSqft: 18,
    otherAnnualCosts: 2_500,
    acquisitionCosts: 101_000,
    rentalEvidenceNotes: "Dated rental index and comparable schedule to be attached.",
    confirmationNotes: "Test scenario.",
  }]);

  assert.equal(result.unitPrice, 2_250_000);
  assert.equal(Math.round(result.unitPricePerSqft), 1_907);
  assert.equal(result.annualServiceCharge, 21_240);
  assert.equal(result.effectiveAnnualRent, 147_250);
  assert.equal(result.effectiveNetAnnualIncome, 123_510);
  assert.equal(result.paymentSchedule.length, 2);
  assert.deepEqual(result.paymentSchedule.map((item) => item.amount), [900_000, 1_350_000]);
  assert.equal(result.advisoryScreen.factors.reduce((sum, factor) => sum + factor.weight, 0), 100);
  assert.match(result.rentalEvidence.indexUrl, /dubailand\.gov\.ae/);
  assert.equal(result.demographicContext?.scope, "Dubai emirate-wide context, not a community estimate");
});

test("adds rental evidence and the transparent advisory screen to client content", () => {
  const projects = buildReportProjects([project], [{
    slug: project.slug,
    bedroom: "2BR",
    unitReference: "2BR scenario",
    unitPrice: 2_250_000,
    unitAreaSqft: 1_180,
    annualRent: 155_000,
    annualRentLow: 140_000,
    annualRentHigh: 170_000,
    occupancyRate: 95,
    serviceChargePerSqft: 18,
    otherAnnualCosts: 2_500,
    acquisitionCosts: 101_000,
    rentalEvidenceNotes: "Dated rental index and comparable schedule to be attached.",
    confirmationNotes: "Test scenario.",
  }]);
  const content = buildCuratedBriefContent({
    projects,
    brief: "Rental and community review.",
    narrative: {},
    advisor: {
      name: "Test Advisor",
      email: "test@hausandgrace.ae",
      phone: "+971 50 000 0000",
      title: "Property Advisor",
    },
    confirmedAt: "2026-07-25T12:00:00.000Z",
  });

  assert.ok(content.marketContext.headline.some((item) => item.label === "Q1 2026 rental contracts"));
  assert.ok(content.marketContext.sources.some((source) => source.label === "Dubai Land Department Rental Index"));
  assert.match(content.confirmation.statement, /sensitivity range/);
  assert.match(content.recommendation, /investment-fit screen/);
});
