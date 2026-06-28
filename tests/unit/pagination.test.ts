import { describe, it, expect } from "vitest";
import { parsePagination, paginated } from "@/lib/api/pagination";

describe("parsePagination", () => {
  it("applies defaults", () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20, skip: 0 });
  });

  it("clamps pageSize to the max", () => {
    expect(parsePagination({ pageSize: "999" }).pageSize).toBe(50);
  });

  it("computes skip from page and pageSize", () => {
    expect(parsePagination({ page: "3", pageSize: "10" }).skip).toBe(20);
  });

  it("coerces invalid values to defaults", () => {
    expect(parsePagination({ page: "abc", pageSize: "xyz" })).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
    });
  });
});

describe("paginated", () => {
  it("computes totalPages (ceil)", () => {
    const r = paginated([1, 2], 25, 1, 10);
    expect(r.totalPages).toBe(3);
    expect(r.total).toBe(25);
    expect(r.data).toEqual([1, 2]);
  });
});
