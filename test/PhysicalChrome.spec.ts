import {expect} from "chai";
import {PhysicalChrome} from "../src";
import {Physical} from "physical";

describe("PhysicalChrome", ()=>{
    let physical : Physical, partner : Physical;
    beforeEach(()=>{
        physical = new PhysicalChrome();
        partner = new PhysicalChrome();
    });
    afterEach(()=>{
        physical.close();
        partner.close();
    });
    it("builds a request", async ()=>{
        let req = await physical.request();
        console.log(req);
        expect(req.author).to.equal("physical-chrome");
        expect(req.supported[0]).to.equal("WebRTC");
        expect(req.body[0].length).to.be.greaterThan(100);
    });
    it("responds to a WebRTC Request", async ()=>{
        let res = await physical.respond(await partner.request());
        expect(res.author).to.equal("physical-chrome");
        expect(res.protocol).to.equal("WebRTC");
        expect(res.body[0].length).to.be.greaterThan(100);
    });
    it("completes a WebRTC Handshake", async ()=>{
        let res = await physical.respond(await partner.request());
        partner.open(res);
    });
    it("opens on requester side", done =>{
        physical.setOnOpen(()=>done());
        physical.request()
            .then(r => partner.respond(r))
            .then(r => physical.open(r));
    });
    it("opens on responder side", done =>{
        partner.setOnOpen(()=>done());
        physical.request()
            .then(r => partner.respond(r))
            .then(r => physical.open(r));
    });
    it("messages go both ways", done =>{
        physical.request()
            .then(r => partner.respond(r))
            .then(r => physical.open(r));
        physical.setOnOpen(()=>{
            physical.send("message from physical");
        });
        partner.setOnMessage((m)=>{
            console.log(m);
            expect(m).to.equal("message from physical");
            partner.send("message from partner");
        });
        physical.setOnMessage((m)=>{
            expect(m).to.equal("message from partner");
            done();
        })
    });
});