import { describe, expect, it } from "vitest";
import { EXAMPLE_DOMAINS, exampleDomainUrl } from "./example-domains";

describe("example domains", () => {
  it("lists exactly the five requested example domains", () => {
    expect(EXAMPLE_DOMAINS).toEqual(["stripe.com", "linear.app", "vercel.com", "notion.so", "github.com"]);
  });
  it("builds an https URL for a domain", () => {
    expect(exampleDomainUrl("stripe.com")).toBe("https://stripe.com");
  });
});
