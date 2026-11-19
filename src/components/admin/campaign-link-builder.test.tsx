import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,expect,it} from "vitest";
import {CampaignLinkBuilder} from "./campaign-link-builder";
afterEach(cleanup);
it("creates a copyable campaign URL and removes the result for invalid labels",()=>{
 render(<CampaignLinkBuilder />);expect(screen.queryByLabelText("Tagged URL")).toBeNull();
 fireEvent.change(screen.getByLabelText("Campaign"),{target:{value:"association-search"}});
 expect(screen.getByLabelText("Tagged URL")).toHaveValue("https://www.orbisy.com/association-websites?utm_source=google&utm_medium=cpc&utm_campaign=association-search");
 fireEvent.change(screen.getByLabelText("Landing page"),{target:{value:"/member-portals"}});
 expect((screen.getByLabelText("Tagged URL") as HTMLInputElement).value).toContain("/member-portals?");
 fireEvent.change(screen.getByLabelText("Campaign"),{target:{value:"person@example.test"}});
 expect(screen.queryByLabelText("Tagged URL")).toBeNull();
});
