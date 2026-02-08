export class Profiler {
    startTimes: Map<string, number> = new Map();
    durations: Map<string, number[]> = new Map();

    start(label: string) {
        if (!this.startTimes.has(label)) {
            this.startTimes.set(label, performance.now());
        }
    }

    stop(label: string) {
        let startTime = this.startTimes.get(label);
        if (!startTime) {
            console.warn(`Profiler: no start time for label "${label}"`);
            return;
        }
        let duration = performance.now() - startTime;
        this.startTimes.delete(label);

        if (!this.durations.has(label)) {
            this.durations.set(label, []);
        }
        this.durations.get(label)!.push(duration);
        if (this.durations.get(label)!.length > 120) {
            this.durations.get(label)!.shift();
        }
    }

    print(label?: string) {
        if (label) {
            let duration = this.durations.get(label);
            if (!duration) {
                console.warn(`Profiler: no duration for label "${label}"`);
                return;
            }
            let total = duration.reduce((a, b) => a + b, 0);
            let average = total / duration.length;
            console.log(`Profiler:\n  ${label}: ${average.toFixed(3)} ms`);
        } else if (this.durations.size > 0) {
            let output = "Profiler:\n";
            this.durations.forEach((duration, label) => {
                let total = duration.reduce((a, b) => a + b, 0);
                let average = total / duration.length;
                output += `  ${label}: ${average.toFixed(3)} ms\n`;
            });
            console.log(output);
        }
    }
}
