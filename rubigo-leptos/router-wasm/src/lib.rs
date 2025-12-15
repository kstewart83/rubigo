use nexosim_guest::{GuestContext, Handler, Packet, export};

struct Router;

impl Handler for Router {
    fn handle(packet: Packet, ctx: &mut GuestContext) {
        ctx.log(&format!(
            "Router received packet from {} to {}",
            packet.src, packet.dest
        ));

        // Simple Routing Logic
        // If dest == 202 (The core router), forward it.
        // If dest == 101 (Me), drop it.

        let my_id = 101;

        if packet.dest == my_id {
            ctx.log("Packet reached destination. Consumed.");
        } else {
            ctx.log("Forwarding packet...");
            // In a real simulation, we might look up a routing table.
            // Here we just pass it through.
            ctx.send(packet);
        }
    }
}

export!(Router);

#[cfg(test)]
mod tests {
    // use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
