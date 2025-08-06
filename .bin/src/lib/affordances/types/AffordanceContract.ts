/**
 * @affordance:AffordanceContract
 * @description: Core interface contract for all compositional affordances
 * @rdf:type: :AffordanceContract
 */

/** @rdf:property :hasCapability */
type CapabilityVector = string;

/** @rdf:property :hasInvariant */
type BehavioralInvariant = Record<string, string>;

/** @rdf:property :hasStateProperty */
interface AffordanceState {
  [key: string]: any;
}

/** @rdf:property :hasMethod */
interface AffordanceMethods {
  [methodName: string]: (...args: any[]) => any;
}

/**
 * @affordance:AffordanceContract
 * @capability:introspection
 * @capability:composition
 * @capability:reconfiguration
 * @invariant:semantic_consistency "Affordance behavior remains semantically consistent across reconfigurations"
 * @invariant:compositional_safety "Affordance compositions do not violate individual affordance invariants"
 */
export interface AffordanceContract<
  TCapabilities extends string,
  TState extends AffordanceState,
  TMethods extends AffordanceMethods
> {
  /** @rdf:property :hasCapability */
  capabilities: TCapabilities[];

  /** @rdf:property :hasInvariant */
  invariants: BehavioralInvariant;

  /** @rdf:property :hasStateProperty */
  state: TState;

  /** @rdf:property :hasMethod */
  methods: TMethods;

  /** @rdf:property :hasIdentifier */
  affordanceId: string;

  /** @rdf:property :hasConfiguration */
  configuration?: Record<string, any>;
}

/**
 * @affordance:AffordanceInstance
 * @description: Runtime instance of an affordance with active state management
 */
export interface AffordanceInstance<
  TContract extends AffordanceContract<any, any, any>
> {
  /** @rdf:property :instanceOf */
  contract: TContract;

  /** @rdf:property :hasRuntimeState */
  runtimeState: TContract["state"];

  /** @rdf:property :hasActiveConfiguration */
  activeConfiguration: Record<string, any>;

  /** @rdf:property :isActive */
  isActive: boolean;

  /** @rdf:property :hasLastUpdate */
  lastUpdate: number;

  // Introspection methods
  /** @rdf:method :inspect */
  inspect(): AffordanceInspection;

  /** @rdf:method :reconfigure */
  reconfigure(changes: Partial<TContract["state"]>): void;

  /** @rdf:method :validate */
  validate(): ValidationResult;
}

/**
 * @affordance:AffordanceInspection
 * @description: Semantic transparency interface for affordance introspection
 */
export interface AffordanceInspection {
  /** @rdf:property :hasActiveCapabilities */
  activeCapabilities: string[];

  /** @rdf:property :hasStateSnapshot */
  stateSnapshot: Record<string, any>;

  /** @rdf:property :hasInvariantStatus */
  invariantStatus: Record<string, "satisfied" | "violated" | "unknown">;

  /** @rdf:property :hasMethodTrace */
  methodTrace: MethodCall[];

  /** @rdf:property :hasCompositionDependencies */
  compositionDependencies: string[];
}

interface MethodCall {
  methodName: string;
  timestamp: number;
  parameters: any[];
  result?: any;
  error?: Error;
}

interface ValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * @affordance:CompositionContract
 * @description: Interface for composing multiple affordances into visualization instances
 */
export interface CompositionContract {
  /** @rdf:property :hasAffordanceBinding */
  affordanceBindings: Record<string, AffordanceInstance<any>>;

  /** @rdf:property :hasCompositionRules */
  compositionRules: CompositionRule[];

  /** @rdf:method :compose */
  compose(): CompositionResult;

  /** @rdf:method :reconfigureComposition */
  reconfigureComposition(changes: CompositionChanges): void;

  /** @rdf:method :validateComposition */
  validateComposition(): ValidationResult;
}

interface CompositionRule {
  type: "dependency" | "conflict" | "enhancement" | "override";
  sourceAffordance: string;
  targetAffordance: string;
  condition?: (source: any, target: any) => boolean;
  action: CompositionAction;
}

interface CompositionAction {
  type: "merge" | "replace" | "augment" | "disable" | "transform";
  parameters?: Record<string, any>;
}

interface CompositionResult {
  instance: any; // The composed visualization instance
  appliedRules: CompositionRule[];
  warnings: string[];
  metadata: Record<string, any>;
}

interface CompositionChanges {
  affordanceUpdates?: Record<string, Partial<AffordanceState>>;
  ruleChanges?: CompositionRule[];
  configurationOverrides?: Record<string, any>;
}
