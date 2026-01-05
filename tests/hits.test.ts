import { createHits } from "../src/index.js";
import { describe, expect, it } from "bun:test";

describe("createHits", () => {
    describe("function", () => {
        it("should create hits with date and total", () => {
            const date = new Date();
            const total = 100;
            const hits = createHits(date, total);

            expect(hits.date).toBe(date);
            expect(hits.total).toBe(total);
        });

        it("should create hits with zero total", () => {
            const date = new Date();
            const total = 0;
            const hits = createHits(date, total);

            expect(hits.date).toBe(date);
            expect(hits.total).toBe(total);
        });

        it("should create hits with negative total", () => {
            const date = new Date();
            const total = -10;
            const hits = createHits(date, total);

            expect(hits.date).toBe(date);
            expect(hits.total).toBe(total);
        });

        it("should create hits with current date", () => {
            const before = new Date();
            const hits = createHits(new Date(), 100);
            const after = new Date();

            expect(hits.date.getTime()).toBeGreaterThanOrEqual(
                before.getTime(),
            );
            expect(hits.date.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it("should create hits with specific date in the past", () => {
            const date = new Date("2020-01-01");
            const hits = createHits(date, 100);

            expect(hits.date).toEqual(date);
        });

        it("should create hits with large total", () => {
            const date = new Date();
            const total = Number.MAX_SAFE_INTEGER;
            const hits = createHits(date, total);

            expect(hits.date).toBe(date);
            expect(hits.total).toBe(total);
        });

        it("should have date property", () => {
            const date = new Date();
            const hits = createHits(date, 100);

            expect(hits.date).toBeInstanceOf(Date);
            expect(hits.date).toBe(date);
        });

        it("should have total property", () => {
            const date = new Date();
            const hits = createHits(date, 100);

            expect(typeof hits.total).toBe("number");
            expect(hits.total).toBe(100);
        });
    });
});
