// Rubigo Statechart Schema
// Shared type definitions for all component specifications

package statechart

// Machine configuration
#MachineConfig: {
	id:      string
	initial: string
	context: {...}

	states: {
		[string]: #StateConfig
	}

	regions?: {
		[string]: #RegionConfig
	}
}

// State configuration
#StateConfig: {
	entry?: [...string]
	exit?: [...string]

	on: {
		[string]: #TransitionConfig | string
	}
}

// Transition configuration
#TransitionConfig: {
	target: string
	actions?: [...string]
	guard?: string
}

// Region for parallel states
#RegionConfig: {
	initial: string
	states: {
		[string]: #StateConfig
	}
}

// Event
#Event: {
	name: string
	payload?: {...}
}

// Result of sending an event
#TransitionResult: {
	handled:    bool
	new_state?: string
	actions_executed: [...string]
}
