import type { IContainerPlugin } from "../../Core/Interfaces/IContainerPlugin";
import { AbsorberInstance } from "./AbsorberInstance";
import { Container } from "../../Core/Container";
import type { Particle } from "../../Core/Particle";
import { ClickMode } from "../../Enums/Modes/ClickMode";
import type { IAbsorber } from "./Options/Interfaces/IAbsorber";
import { Utils } from "../../Utils";
import { Absorber } from "./Options/Classes/Absorber";
import { SingleOrMultiple } from "../../Types/SingleOrMultiple";
import { IOptions } from "../../Options/Interfaces/IOptions";
import { RecursivePartial } from "../../Types/RecursivePartial";
import { IInteractivity } from "../../Options/Interfaces/Interactivity/IInteractivity";
import { IModes } from "../../Options/Interfaces/Interactivity/Modes/IModes";

type AbsorberOptions = IOptions & {
    absorbers: SingleOrMultiple<Absorber>;
    interactivity: IInteractivity & {
        modes: IModes & {
            absorbers: SingleOrMultiple<Absorber>;
        };
    };
};

export class Absorbers implements IContainerPlugin {
    public readonly container: Container;
    public array: AbsorberInstance[];
    public absorbers: SingleOrMultiple<Absorber>;
    public interactivityAbsorbers: SingleOrMultiple<Absorber>;

    constructor(container: Container) {
        this.container = container;
        this.array = [];
        this.absorbers = [];
        this.interactivityAbsorbers = [];
    }

    public init(options?: RecursivePartial<AbsorberOptions>): void {
        if (!options) {
            return;
        }

        if (options.absorbers) {
            if (options.absorbers instanceof Array) {
                this.absorbers = options.absorbers.map((s) => {
                    const tmp = new Absorber();

                    tmp.load(s);

                    return tmp;
                });
            } else {
                if (this.absorbers instanceof Array) {
                    this.absorbers = new Absorber();
                }

                this.absorbers.load(options.absorbers);
            }
        }

        const interactivityAbsorbers = options.interactivity?.modes?.absorbers;

        if (interactivityAbsorbers) {
            if (interactivityAbsorbers instanceof Array) {
                this.interactivityAbsorbers = interactivityAbsorbers.map((s) => {
                    const tmp = new Absorber();

                    tmp.load(s);

                    return tmp;
                });
            } else {
                if (this.interactivityAbsorbers instanceof Array) {
                    this.interactivityAbsorbers = new Absorber();
                }

                this.interactivityAbsorbers.load(interactivityAbsorbers);
            }
        }

        if (this.absorbers instanceof Array) {
            for (const absorberOptions of this.absorbers) {
                const absorber = new AbsorberInstance(this, absorberOptions);

                this.addAbsorber(absorber);
            }
        } else {
            const absorberOptions = this.absorbers;
            const absorber = new AbsorberInstance(this, absorberOptions);

            this.addAbsorber(absorber);
        }
    }

    public particleUpdate(particle: Particle, delta: number): void {
        for (const absorber of this.array) {
            absorber.attract(particle, delta);

            if (particle.destroyed) {
                break;
            }
        }
    }

    public draw(context: CanvasRenderingContext2D): void {
        for (const absorber of this.array) {
            context.save();
            absorber.draw(context);
            context.restore();
        }
    }

    public stop(): void {
        this.array = [];
    }

    public resize(): void {
        for (const absorber of this.array) {
            absorber.resize();
        }
    }

    public handleClickMode(mode: ClickMode | string): void {
        const container = this.container;
        const absorberOptions = this.absorbers;
        const modeAbsorbers = this.interactivityAbsorbers;

        if (mode === ClickMode.absorber) {
            let absorbersModeOptions: IAbsorber | undefined;

            if (modeAbsorbers instanceof Array) {
                if (modeAbsorbers.length > 0) {
                    absorbersModeOptions = Utils.itemFromArray(modeAbsorbers);
                }
            } else {
                absorbersModeOptions = modeAbsorbers;
            }

            const absorbersOptions =
                absorbersModeOptions ??
                (absorberOptions instanceof Array ? Utils.itemFromArray(absorberOptions) : absorberOptions);
            const aPosition = container.interactivity.mouse.clickPosition;
            const absorber = new AbsorberInstance(this, absorbersOptions, aPosition);

            this.addAbsorber(absorber);
        }
    }

    public addAbsorber(absorber: AbsorberInstance): void {
        this.array.push(absorber);
    }

    public removeAbsorber(absorber: AbsorberInstance): void {
        const index = this.array.indexOf(absorber);

        if (index >= 0) {
            this.array.splice(index, 1);
        }
    }
}
