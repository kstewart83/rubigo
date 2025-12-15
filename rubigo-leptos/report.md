Advanced Hybrid Simulation Architecture: Integrating Metalog Distributions and Native-WASM High-Performance Compute Models1. Introduction: The Convergence of Flexibility and Performance in Network SimulationThe domain of discrete-event simulation (DES), particularly within the context of large-scale distributed systems and high-fidelity network modeling, currently faces a significant architectural dichotomy. On one hand, there is an imperative need for extreme computational throughput to model complex topologies involving millions of packet events per second. On the other hand, the utility of a simulation platform is directly proportional to its extensibility—the ability for users to inject custom protocols, failure modes, and traffic patterns without recompiling the core engine. This report proposes and details a novel Hybrid Execution Architecture designed to resolve this tension by bifurcating the simulation logic into two distinct execution planes: a Native High-Performance Plane for generic infrastructure and a Sandboxed Extension Plane using WebAssembly (WASM) for custom logic.Furthermore, the fidelity of any simulation is fundamentally limited by the accuracy of its stochastic inputs. Traditional parametric distributions (Gaussian, Exponential, Weibull) often fail to capture the complex, multi-modal, and heavy-tailed behaviors observed in real-world network latency and component reliability data. To address this, this architecture mandates the exclusive use of Metalog (Metalogistic) Distributions for all stochastic modeling requirements. The Metalog system offers a mathematically rigorous, quantile-parameterized framework that provides virtually unlimited shape flexibility and closed-form sampling, thereby eliminating the computational overhead of numerical inversion methods common in legacy systems.This document serves as a comprehensive technical blueprint for implementing this architecture. It covers the mathematical derivation of Metalog basis functions, the memory layout strategies for zero-copy data transfer between Rust and WASM, the static dispatch patterns for optimizing generic component throughput, and the data persistence schemas required for high-velocity telemetry.2. The Stochastic Core: Mathematical Foundations of the Metalog Distribution2.1 The Limitations of Classical Distributions in Network ModelingIn the simulation of distributed systems, accurate probabilistic modeling is the cornerstone of validity. Parameters such as link latency, packet loss rates, and Mean Time Between Failures (MTBF) are rarely well-described by simple textbook distributions. For instance, network latency distributions often exhibit a "long tail" caused by bufferbloat and retransmission timeouts, which a standard Normal or Lognormal distribution may significantly underestimate. Similarly, failure rates often follow a "bathtub curve" or exhibit multimodal characteristics depending on the hardware generation and environmental stress factors.Classical Type I (theoretical) and Type II (approximate) distributions impose rigid shape constraints. Fitting a Weibull distribution to empirical data that is bimodal will result in a statistically invalid model that obscures the very risks the simulation aims to uncover.4 Furthermore, sampling from these distributions during the simulation's inner loop often requires numerical methods (e.g., the Ziggurat algorithm or Newton-Raphson inversion) if the Inverse Cumulative Distribution Function (CDF) does not exist in closed form.5 In a simulation processing billions of events, these iterative numerical methods accumulate into a substantial performance penalty.2.2 The Metalog Solution: Quantile-Parameterized Distributions (QPDs)The Metalog distributions, introduced by Thomas Keelin (2016), represent a paradigm shift in stochastic modeling. They are Quantile-Parameterized Distributions (QPDs), meaning they are defined directly by their quantile function $Q(y) = F^{-1}(y)$, where $y$ is the cumulative probability $0 < y < 1$. This property is pivotal for simulation performance because generating a random variate requires only a single evaluation of a closed-form algebraic equation using a uniform random number $U \sim $.42.2.1 Mathematical Derivation from the Logistic BaseThe Metalog system generalizes the logistic distribution. The quantile function of the standard logistic distribution is given by:$$x = \mu + s \ln\left(\frac{y}{1-y}\right)$$where $\mu$ is the location parameter (median) and $s$ is the scale parameter.Keelin's innovation was to replace the constant parameters $\mu$ and $s$ with power series expansions in terms of the cumulative probability $y$. This effectively creates a Taylor series for the probability distribution itself, where adding more terms allows the distribution to conform closer to any arbitrary shape.7The expansions are defined as:$$\mu(y) = a_1 + a_4(y - 0.5) + a_5(y - 0.5)^2 + \dots$$$$s(y) = a_2 + a_3(y - 0.5) + a_6(y - 0.5)^2 + \dots$$By substituting these expansions back into the logistic quantile equation, we derive the general $k$-term Metalog quantile function $M_k(y)$.2.3 Basis Functions and the Design MatrixThe implementation of Metalog distributions relies on a linear model structure. The quantile function $M_k(y)$ can be expressed as a linear combination of coefficients $a_i$ and basis functions $g_i(y)$:$$M_k(y) = \sum_{i=1}^{k} a_i g_i(y)$$Understanding these basis functions is critical for implementing the fitting algorithm. The basis functions for terms $k=1$ through $k=10$ are derived recursively as follows 6:Term (k)Coefficient (ak​)Basis Function gk​(y)Source ComponentInterpretation1$a_1$$1$$\mu$ expansion term 1Median / Location2$a_2$$\ln\left(\frac{y}{1-y}\right)$$s$ expansion term 1Logistic Scale / Variance3$a_3$$(y-0.5) \ln\left(\frac{y}{1-y}\right)$$s$ expansion term 2Skewness Asymmetry4$a_4$$y - 0.5$$\mu$ expansion term 2Kurtosis / Tail Weight5$a_5$$(y - 0.5)^2$$\mu$ expansion term 3Higher-order shape6$a_6$$(y - 0.5)^2 \ln\left(\frac{y}{1-y}\right)$$s$ expansion term 3Higher-order shape7$a_7$$(y - 0.5)^3$$\mu$ expansion term 4Higher-order shape8$a_8$$(y - 0.5)^3 \ln\left(\frac{y}{1-y}\right)$$s$ expansion term 4Higher-order shape9$a_9$$(y - 0.5)^4$$\mu$ expansion term 5Higher-order shape10$a_{10}$$(y - 0.5)^4 \ln\left(\frac{y}{1-y}\right)$$s$ expansion term 5Higher-order shapeFor odd $k \ge 5$, the basis function is $g_k(y) = (y - 0.5)^{\frac{k-1}{2}}$.For even $k \ge 6$, the basis function is $g_k(y) = (y - 0.5)^{\frac{k}{2}-1} \ln\left(\frac{y}{1-y}\right)$.This linear structure means that fitting a Metalog distribution to data is reduced to a Linear Least Squares (OLS) problem, avoiding the instability and performance costs of non-linear optimization techniques like Maximum Likelihood Estimation (MLE) used for other distributions.42.4 Boundedness and TransformationsNetwork parameters are physically constrained. Latency cannot be negative. Packet loss ratios must be between 0 and 1. The Unbounded Metalog $M_k(y)$ spans $(-\infty, \infty)$. To model bounded data, we apply transformations.82.4.1 Semi-Bounded Metalog (Lower Bound $b_L$)Used for distributions with a hard lower limit, such as latency (bounded by propagation delay) or file sizes.$$M_k^{\text{log}}(y) = b_L + \exp(M_k(y))$$Fitting involves transforming the data $x$ into $z = \ln(x - b_L)$ and fitting the unbounded Metalog to $z$.2.4.2 Bounded Metalog (Interval $[b_L, b_U]$)Used for probabilities, percentages, or capacity limits.$$M_k^{\text{logit}}(y) = \frac{b_L + b_U \exp(M_k(y))}{1 + \exp(M_k(y))}$$Fitting involves transforming the data $x$ into $z = \ln\left(\frac{x - b_L}{b_U - x}\right)$ and fitting the unbounded Metalog to $z$.3. Rust Implementation Strategy for Metalog DistributionsThe implementation of Metalog distributions in Rust must prioritize two distinct operational phases: Fitting (performed infrequently, often at initialization) and Sampling (performed millions of times during simulation).3.1 Data StructuresWe define a robust MetalogDistribution struct that encapsulates the coefficients and the bounds strategy. Storing the coefficients directly avoids re-calculating them and allows the struct to be Copy (if using fixed-size arrays) or cheaply Cloneable, which is essential for passing distribution parameters to thousands of network actors.8Rust#
pub enum MetalogBounds {
    Unbounded,
    SemiBoundedLower(f64),
    SemiBoundedUpper(f64),
    Bounded(f64, f64),
}

pub struct MetalogDistribution {
    /// The 'a' coefficients: [a1, a2,..., ak]
    coefficients: Vec<f64>,
    bounds: MetalogBounds,
    /// Minimum y value for validity (feasibility range)
    min_y: f64,
    /// Maximum y value for validity
    max_y: f64,
}
3.2 Fitting Algorithm: Linear Least SquaresTo fit the distribution to empirical data points $(x_i, y_i)$, we construct the design matrix $\mathbf{Y}$ where each row $i$ corresponds to a data point and each column $j$ corresponds to the basis function $g_j(y_i)$ evaluated at that cumulative probability.The system of linear equations is $\mathbf{z} = \mathbf{Y}\mathbf{a}$, where $\mathbf{z}$ is the transformed data vector. The solution for the coefficients $\mathbf{a}$ minimizes the squared error:$$\mathbf{a} = (\mathbf{Y}^T \mathbf{Y})^{-1} \mathbf{Y}^T \mathbf{z}$$In Rust, the nalgebra or faer crates provide highly optimized linear algebra routines. faer is particularly recommended for its pure Rust implementation and performance parity with BLAS/LAPACK on modern CPUs.93.2.1 Implementation using nalgebraRustuse nalgebra::{DMatrix, DVector};

pub fn fit_metalog(data_x: &[f64], data_y: &[f64], terms: usize, bounds: MetalogBounds) -> Result<MetalogDistribution, String> {
    let n = data_x.len();
    
    // 1. Transform Data (z vector) based on bounds
    let z_values: Vec<f64> = data_x.iter().map(|&x| match bounds {
        MetalogBounds::Unbounded => x,
        MetalogBounds::SemiBoundedLower(bl) => (x - bl).ln(),
        MetalogBounds::Bounded(bl, bu) => ((x - bl) / (bu - x)).ln(),
        //... handle other cases
    }).collect();
    let z = DVector::from_vec(z_values);

    // 2. Construct Design Matrix Y
    let mut y_mat = DMatrix::zeros(n, terms);
    for (row, &y) in data_y.iter().enumerate() {
        // Calculate basis functions g1(y)... gk(y)
        y_mat[(row, 0)] = 1.0; // a1
        if terms > 1 { y_mat[(row, 1)] = (y / (1.0 - y)).ln(); } // a2
        if terms > 2 { y_mat[(row, 2)] = (y - 0.5) * (y / (1.0 - y)).ln(); } // a3
        if terms > 3 { y_mat[(row, 3)] = y - 0.5; } // a4
        //... loop for higher order terms using the recursive definition
    }

    // 3. Solve for coefficients a using SVD for stability
    let a = y_mat.svd(true, true).solve(&z, 1e-9)
       .ok_or("Linear least squares solution failed")?;

    Ok(MetalogDistribution {
        coefficients: a.as_slice().to_vec(),
        bounds,
        min_y: 0.001, // Default valid range
        max_y: 0.999,
    })
}
This fitting process occurs once per distribution definition. The svd (Singular Value Decomposition) approach is preferred over direct matrix inversion because the design matrix $\mathbf{Y}$ can become ill-conditioned, especially with a high number of terms ($k > 10$) or clustered data points.113.3 High-Performance Sampling via randFor the simulation loop, we implement the Distribution trait from the rand_distr crate. This integration allows Metalog distributions to be treated like any standard distribution (Uniform, Normal) within the Rust ecosystem.The sampling function's critical path involves evaluating the basis functions and summing the terms. Given that $a_1 \dots a_k$ are constant during sampling, we can optimize the calculation.Rustuse rand::Rng;
use rand::distr::Distribution;

impl Distribution<f64> for MetalogDistribution {
    fn sample<R: Rng +?Sized>(&self, rng: &mut R) -> f64 {
        let y: f64 = rng.random(); // Uniform(0, 1)
        
        // Optimization: Pre-calculate common terms
        let y_minus_05 = y - 0.5;
        let log_odds = (y / (1.0 - y)).ln();
        
        // Evaluate Unbounded Metalog M(y)
        // Explicitly unroll for small k to aid auto-vectorization
        let mut m_y = self.coefficients; // a1 * 1
        if self.coefficients.len() > 1 {
            m_y += self.coefficients[1] * log_odds;
        }
        if self.coefficients.len() > 2 {
            m_y += self.coefficients[2] * y_minus_05 * log_odds;
        }
        if self.coefficients.len() > 3 {
            m_y += self.coefficients[3] * y_minus_05;
        }
        //... Handle higher order terms via loop or Horner's method
        
        // Apply Transform
        match self.bounds {
            MetalogBounds::Unbounded => m_y,
            MetalogBounds::SemiBoundedLower(bl) => bl + m_y.exp(),
            MetalogBounds::Bounded(bl, bu) => {
                let e = m_y.exp();
                (bl + bu * e) / (1.0 + e)
            }
            _ => m_y //...
        }
    }
}
Optimization Notes: The most expensive instruction in the sampling path is ln() and exp(). For simulations requiring extreme throughput, we can utilize the fast_math crate which provides approximations for these functions with a defined error bound. However, for most network simulations, standard f64 precision is required to accurately model tail latencies (e.g., distinguishing between 100ms and 100.01ms is irrelevant, but distinguishing 1s from 10s in the tail is critical).124. Hybrid Simulation Architecture: Native & WASMThe core architectural innovation of this platform is the split-execution model. The simulation engine must handle two classes of entities with fundamentally different requirements:Generic Infrastructure (Routers, Switches, Cables): High volume, standardized behavior, performance-critical.Custom Logic (User Applications, proprietary protocols): Lower volume, dynamic behavior, security-critical.4.1 Native Plane: Optimizing Generic Components via Static DispatchIn Rust, polymorphism is typically achieved via Traits. There are two primary mechanisms:Dynamic Dispatch (Box<dyn Component>): Uses a vtable. The compiler cannot inline method calls. Each call involves a pointer indirection, which can stall the CPU pipeline and cause instruction cache misses.Static Dispatch (enum delegation): Uses an enum to wrap all possible concrete types. Method calls are dispatched via a match statement. This allows the compiler to see the concrete types, enabling aggressive inlining and optimization.For the generic components that constitute 90%+ of the simulation events, Static Dispatch is mandatory. Benchmark data indicates that pattern matching (static dispatch) can be orders of magnitude faster than dynamic dispatch for simple methods, and significantly faster (2.7x) even for complex workloads due to inlining opportunities.144.1.1 The enum_dispatch PatternWe utilize the enum_dispatch crate to ergonomically implement this pattern. This macro automatically generates the match boilerplate required to delegate trait methods to the inner structs.The Trait Definition:Rust#[enum_dispatch]
pub trait NetworkModel {
    fn process_event(&mut self, event: Event, ctx: &mut Context);
    fn id(&self) -> ComponentId;
}
The Unified Component Enum:Rust#[enum_dispatch(NetworkModel)]
pub enum Component {
    Router(RouterModel),
    Switch(SwitchModel),
    OpticalCable(CableModel),
    // The bridge to the dynamic world
    WasmWrapper(WasmHostWrapper),
}
By wrapping the WasmHostWrapper within this enum, we maintain a unified type system. The simulation scheduler holds a Vec<Component>. When it processes an event, it calls component.process_event(). For a Router, this call is statically dispatched and inlined. For a WasmWrapper, it jumps to the WASM handling logic. This ensures that the overhead of WASM support is only paid when a WASM component is actually involved in an event.4.2 Sandboxed Plane: WebAssembly for Custom LogicFor user-defined models, we utilize WebAssembly (WASM). WASM provides a portable, secure compilation target that allows users to write models in Rust, C++, or AssemblyScript. We use wasmtime as the runtime due to its support for the Component Model and its high-performance Cranelift JIT compiler.154.2.1 The Memory Wall ProblemThe primary performance bottleneck in WASM is the "Memory Wall"—the cost of copying data between the Host (Native Rust) and the Guest (WASM Linear Memory). In a naive implementation, passing a 1.5KB network packet to a WASM model involves:Allocating memory in the Guest.Copying bytes from Host to Guest.Executing the Guest function.Copying the result back to Host.Deallocating Guest memory.For a simulation running millions of packets, this malloc/memcpy/free cycle is prohibitive.4.3 Zero-Copy Shared Memory ArchitectureTo achieve high performance for custom components, we implement a Zero-Copy Shared Memory protocol using repr(C) structs and raw pointer arithmetic. This approach bypasses the safe but slow serialization of high-level types.4.3.1 Shared Memory Layout StrategyInstead of allocating memory per packet, the Host manages a persistent Shared Packet Buffer mapped into the Guest's linear memory.Memory Export: The WASM module exports its linear memory (memory). The Host (Rust) acquires a raw pointer to this memory space using wasmtime::Memory::data_ptr().Pinned Buffer: The Guest allocates a large static buffer (e.g., a Ring Buffer or Slab) at startup and exports a pointer to its base address to the Host.Data Ingestion: When a packet arrives for the WASM component, the Host writes the packet data directly into the Guest's pre-allocated buffer using std::ptr::copy_nonoverlapping. This is a raw memcpy which is extremely fast (SIMD optimized by LLVM).Pointer Passing: The Host calls the Guest function, passing only the offset (index) into the linear memory where the packet resides.4.3.2 Host-Side Implementation (Rust)Rustpub struct WasmHostWrapper {
    instance: Instance,
    memory: Memory,
    // Pre-calculated offset to the guest's input buffer
    guest_buffer_offset: usize, 
    process_func: TypedFunc<(i32, i32), i32>, 
}

impl NetworkModel for WasmHostWrapper {
    fn process_event(&mut self, event: Event, ctx: &mut Context) {
        if let Event::PacketReceived(packet) = event {
            // UNSAFE: Direct write to WASM memory
            // We assume guest_buffer_offset is valid and has capacity.
            unsafe {
                let raw_mem = self.memory.data_mut(&mut self.store);
                let dest_ptr = raw_mem.as_mut_ptr().add(self.guest_buffer_offset);
                
                // Copy packet data directly
                std::ptr::copy_nonoverlapping(
                    packet.data.as_ptr(), 
                    dest_ptr, 
                    packet.len()
                );
            }

            // Call WASM function with (offset, length)
            let result = self.process_func.call(
                &mut self.store, 
                (self.guest_buffer_offset as i32, packet.len() as i32)
            ).unwrap();
            
            // Handle result code (e.g., 0=Drop, 1=Forward)
            self.handle_result(result, ctx);
        }
    }
}
4.3.3 Guest-Side Implementation (Rust compiled to WASM)The Guest defines the data layout using repr(C) to ensure it matches the byte stream written by the Host.Rust#[repr(C)]
pub struct PacketHeader {
    pub src_ip: u32,
    pub dest_ip: u32,
    pub protocol: u8,
    pub _padding: [u8; 3], // Alignment padding
    pub payload_len: u16,
}

#[no_mangle]
pub extern "C" fn process_packet(ptr: *const u8, len: usize) -> i32 {
    // Zero-copy cast: Treat the raw bytes as a Packet struct reference
    // "bytemuck" crate handles the safe casting checks
    let header_slice = unsafe { std::slice::from_raw_parts(ptr, std::mem::size_of::<PacketHeader>()) };
    let header: &PacketHeader = bytemuck::from_bytes(header_slice);

    // Custom Logic
    if header.protocol == 17 { // UDP
        return 0; // Drop packet
    }
    
    1 // Forward packet
}
This architecture reduces the overhead to a single memcpy and a function call, enabling WASM components to process packets at near-native speeds while retaining memory isolation safety guarantees (the Guest cannot access Host memory outside its sandbox).164.4 The Role of the Component Model (WIT)While the raw pointer approach is necessary for the hot path (data plane), we utilize the WASM Component Model and WIT (Wasm Interface Type) for the control plane (configuration, status reporting, setup). wit-bindgen allows us to define high-level interfaces for these interaction points where the slight serialization overhead is negligible compared to the ease of development.18simulation.wit:Code snippetpackage nexosim:simulation;

interface control {
    // Rich types for configuration
    record config {
        mtbf: float64,
        routing-table: list<u32>,
    }
    configure: func(c: config);
    get-status: func() -> string;
}

world component-v1 {
    export control;
}
This hybrid approach—Raw Memory for Data Plane, Component Model for Control Plane—optimizes for both performance and developer experience.5. Simulation Engine Design: nexosim IntegrationThe orchestration of these models is handled by the nexosim (formerly Asynchronix) framework. This engine is selected for its "causal messaging" guarantees and high-throughput actor model.205.1 Event Scheduling with Binary Heapsnexosim employs a discrete-event scheduler backed by a Binary Heap (Min-Heap) priority queue. This data structure allows for $O(\log N)$ insertion and extraction of events, ordered by timestamp. In a simulation with millions of pending events, the efficiency of this queue is the primary determinant of execution speed.22Events are processed in a unified loop:Extract event with smallest timestamp $T_{min}$.Advance simulation clock to $T_{min}$.Dispatch event to the target Component (Native or WASM).Collect new events generated by the component and insert into the Heap.5.2 Threading and Concurrencynexosim supports multi-threaded execution by treating models as actors. The scheduler automatically distributes actors across a thread pool.Native Actors: Are fundamentally thread-safe and can be migrated between threads.WASM Actors: wasmtime::Instance and Store are generally not thread-safe (!Sync). Therefore, each WasmHostWrapper essentially pins its WASM instance to its owning actor. The nexosim executor ensures that the actor (and thus the WASM instance) is only accessed by one thread at a time, preserving safety without requiring complex internal locking within the WASM module.216. Telemetry and Data PersistenceHigh-performance simulation generates vast amounts of data. We require a storage backend that can ingest time-series metrics at high velocity and support complex, structured queries for post-simulation analysis.6.1 SurrealDB Schema DesignSurrealDB is selected for its hybrid nature, acting as both a document store (for hierarchical configurations) and a relational database (for network topology), with specific optimizations for time-series data.236.1.1 Schemafull Tables for StructureWe enforce strict schemas for the core entities to ensure data integrity.SQLDEFINE TABLE device SCHEMAFULL;
DEFINE FIELD type ON TABLE device TYPE string ASSERT $value INSIDE ['router', 'switch', 'cable', 'custom'];
DEFINE FIELD metalog_coeffs ON TABLE device TYPE array<float>; // Store coefficients for reconstruction
6.1.2 Optimization: Array-based Record IDsFor telemetry metrics (e.g., queue depth, latency samples), we utilize Array-based Record IDs. This is a SurrealDB optimization that avoids storing a separate index for time-series lookups. By encoding the device_id and timestamp directly into the primary key [device_id, timestamp], we enable extremely fast range queries (e.g., "Get all metrics for Router X between T1 and T2") without a secondary index scan.24SQLDEFINE TABLE metric SCHEMALESS;
-- ID format: metric:[<device_id>, <timestamp_nanos>]
DEFINE FIELD val ON TABLE metric TYPE float; 
6.1.3 Numeric PrecisionWe strictly use float (64-bit IEEE 754) for metric values to align with Rust's f64 and avoid the overhead of decimal arbitrary-precision arithmetic, which is unnecessary for standard network telemetry.256.2 Observability via TracingWe integrate the tracing crate for structured logging.Native Components: Emit standard tracing::info! events.WASM Components: Since WASM cannot print to stdout directly, we expose a host import log_event. The WASM module calls this import, passing the log message pointer. The Host reads the message and re-emits it as a native tracing event. This ensures that logs from WASM components are interleaved correctly with native logs and carry the correct simulation context (causal history).26Rust// Host Import Implementation
linker.func_wrap("env", "log", |mut caller: Caller<'_, _>, ptr: i32, len: i32| {
    let msg = read_string_from_wasm(&mut caller, ptr, len);
    // Re-emit into the native tracing system
    tracing::info!(target: "wasm_guest", "{}", msg);
});
7. ConclusionThis report outlines a state-of-the-art simulation architecture that refuses to compromise between performance and flexibility. By adopting Metalog distributions, we ensure that the stochastic underpinnings of the simulation are statistically rigorous, capable of modeling the complex, heavy-tailed realities of modern networks without the computational tax of numerical inversion. By engineering a Hybrid Execution Model, we leverage the raw speed of native Rust for the vast majority of operations while providing a secure, standard-compliant WASM sandbox for user extensibility.The combination of enum_dispatch for static polymorphism, Zero-Copy Shared Memory for Host-Guest data exchange, and nexosim's heap-based scheduling creates a pipeline optimized for instruction-level efficiency. Coupled with a SurrealDB schema optimized for time-series ingestion, this platform stands ready to support the next generation of large-scale network digital twins.Appendix A: Summary of Performance OptimizationsOptimization StrategyTarget ComponentMechanismEstimated Gain vs BaselineMetalog DistributionsStochastic VariablesClosed-form Quantile Function (Algebraic)10x-50x vs Numerical Inversion Sampling 5Static DispatchGeneric Models (Router/Switch)enum_dispatch (Inlining, Branch Prediction)2.7x - 72,000x vs dyn Trait 14Zero-Copy MemoryWASM Data PlaneShared Memory + Pointer PassingOrders of magnitude vs malloc/memcpy per packetArray-based IDsData PersistenceSurrealDB Primary Key EncodingSignificant reduction in index scan time for range queries 24Appendix B: Metalog Basis Function Design Matrix (Example $k=4$)For a set of empirical data points with cumulative probabilities $\mathbf{y} = [y_1, y_2, \dots, y_n]^T$, the design matrix $\mathbf{Y}$ used in the Linear Least Squares fitting process is structured as follows:Data Point (j)Term 1 (a1​)Term 2 (a2​)Term 3 (a3​)Term 4 (a4​)$y_1$1$\ln\left(\frac{y_1}{1-y_1}\right)$$(y_1 - 0.5)\ln\left(\frac{y_1}{1-y_1}\right)$$y_1 - 0.5$$y_2$1$\ln\left(\frac{y_2}{1-y_2}\right)$$(y_2 - 0.5)\ln\left(\frac{y_2}{1-y_2}\right)$$y_2 - 0.5$$\dots$$\dots$$\dots$$\dots$$\dots$$y_n$1$\ln\left(\frac{y_n}{1-y_n}\right)$$(y_n - 0.5)\ln\left(\frac{y_n}{1-y_n}\right)$$y_n - 0.5$The coefficients $\mathbf{a}$ are then solved via $\mathbf{a} = (\mathbf{Y}^T\mathbf{Y})^{-1}\mathbf{Y}^T\mathbf{x}$ (where $\mathbf{x}$ is the observed data vector). This matrix structure highlights the linearity of the Metalog system, which is the key to its fitting performance.