# KeyQuest

A visual first-then schedule for a child, wrapped in a keys-and-doors quest.
Tauri 2 (Rust) + React + TypeScript. All data stays on the device.

## Run

```sh
npm install
npm run tauri dev        # desktop window
npm run tauri build      # installer / package
cargo test --manifest-path src-tauri/Cargo.toml --lib   # storage tests
```

Linux needs the usual Tauri libraries (webkit2gtk-4.1, gtk3, ...). See
https://tauri.app/start/prerequisites/

## How it works

- **Child screen**: "First <step> -> Then <reward>" at the top, one big door per step,
  an optional visual timer, and the whole schedule as a row of doors at the bottom.
  Tapping Done turns the key, opens the door, and moves on. After the last door the
  quest ends clearly and shows the reward. No random rewards, no endless play.
- **Parent area**: hold the gear for ~1.3 s, enter the PIN (default `0000`, change it
  in Settings). Edit schedules (icons or your own photos, timers, reward), rate how much
  help each step needed, keep an ABC behaviour log (CSV export), print the schedule.
- Languages: Russian, Italian, English.

## Notes

- Tablet/phone builds use Tauri 2 mobile (`npm run tauri android init` / `ios init`);
  not set up or tested here.
- This is a support tool, not a treatment. Agree the schedule and how to introduce it
  with the child's therapist.
