use nalgebra::{DMatrix, DVector};
use rand::distr::Distribution;
use rand::Rng;

#[derive(Debug, Clone, Copy)]
pub enum MetalogBounds {
    Unbounded,
    SemiBoundedLower(f64),
    SemiBoundedUpper(f64),
    Bounded(f64, f64),
}

#[derive(Debug, Clone)]
pub struct MetalogDistribution {
    /// The 'a' coefficients: [a1, a2,..., ak]
    pub coefficients: Vec<f64>,
    pub bounds: MetalogBounds,
    /// Minimum y value for validity (feasibility range)
    pub min_y: f64,
    /// Maximum y value for validity
    pub max_y: f64,
}

impl MetalogDistribution {
    pub fn new(coefficients: Vec<f64>, bounds: MetalogBounds) -> Self {
        Self {
            coefficients,
            bounds,
            min_y: 0.001,
            max_y: 0.999,
        }
    }
}

pub fn fit_metalog(
    data_x: &[f64],
    data_y: &[f64],
    terms: usize,
    bounds: MetalogBounds,
) -> Result<MetalogDistribution, String> {
    let n = data_x.len();
    if n != data_y.len() {
        return Err("Data lengths mismatch".to_string());
    }

    // 1. Transform Data (z vector) based on bounds
    let z_values: Vec<f64> = data_x
        .iter()
        .map(|&x| match bounds {
            MetalogBounds::Unbounded => x,
            MetalogBounds::SemiBoundedLower(bl) => (x - bl).ln(),
            MetalogBounds::SemiBoundedUpper(bu) => (bu - x).ln(), // Symmetric to lower
            MetalogBounds::Bounded(bl, bu) => ((x - bl) / (bu - x)).ln(),
        })
        .collect();
    let z = DVector::from_vec(z_values);

    // 2. Construct Design Matrix Y
    let mut y_mat = DMatrix::zeros(n, terms);
    for (row, &y) in data_y.iter().enumerate() {
        // Validation for y
        if y <= 0.0 || y >= 1.0 {
            return Err(format!("Invalid probability y={} at index {}", y, row));
        }
        
        // Calculate basis functions g1(y)... gk(y)
        // a1
        y_mat[(row, 0)] = 1.0; 
        
        if terms > 1 {
            // a2: ln(y / (1-y))
            y_mat[(row, 1)] = (y / (1.0 - y)).ln(); 
        }
        
        if terms > 2 {
            // a3: (y-0.5) * ln(y / (1-y))
            y_mat[(row, 2)] = (y - 0.5) * (y / (1.0 - y)).ln();
        }
        
        if terms > 3 {
             // a4: y - 0.5
            y_mat[(row, 3)] = y - 0.5;
        }
        
        // Higher order terms k=5..terms
        for k in 5..=terms {
            // Arrays are 0-indexed, so coefficient ak is at column k-1
            let col = k - 1;
            let y_cen = y - 0.5;
            let log_odds = (y / (1.0 - y)).ln();
            
            if k % 2 != 0 {
                // Odd k: (y-0.5)^((k-1)/2)
                let power = (k - 1) / 2;
                y_mat[(row, col)] = y_cen.powi(power as i32);
            } else {
                // Even k: (y-0.5)^(k/2 - 1) * ln(...)
                let power = k / 2 - 1;
                y_mat[(row, col)] = y_cen.powi(power as i32) * log_odds;
            }
        }
    }

    // 3. Solve for coefficients a using SVD for stability
    // solve(&z, epsilon)
    let a = y_mat
        .svd(true, true)
        .solve(&z, 1e-9)
        .map_err(|e| format!("Linear least squares solution failed: {}", e))?;

    Ok(MetalogDistribution {
        coefficients: a.as_slice().to_vec(),
        bounds,
        min_y: 0.001,
        max_y: 0.999,
    })
}

impl Distribution<f64> for MetalogDistribution {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> f64 {
        let y: f64 = rng.random(); // Uniform(0, 1) // In rand 0.9.x it is random() not gen()
        
        // Optimization: Pre-calculate common terms
        let y_cen = y - 0.5;
        let log_odds = (y / (1.0 - y)).ln();
        
        // Evaluate Unbounded Metalog M(y)
        // We accumulate the sum.
        let mut m_y = 0.0;
        
        for (i, &coeff) in self.coefficients.iter().enumerate() {
            let k = i + 1; // 1-based term index
            
            let term_val = if k == 1 {
                1.0
            } else if k == 2 {
                log_odds
            } else if k == 3 {
                y_cen * log_odds
            } else if k == 4 {
                y_cen
            } else {
                if k % 2 != 0 {
                    let power = (k - 1) / 2;
                    y_cen.powi(power as i32)
                } else {
                    let power = k / 2 - 1;
                    y_cen.powi(power as i32) * log_odds
                }
            };
            
            m_y += coeff * term_val;
        }
        
        // Apply Transform
        match self.bounds {
            MetalogBounds::Unbounded => m_y,
            MetalogBounds::SemiBoundedLower(bl) => bl + m_y.exp(),
            MetalogBounds::SemiBoundedUpper(bu) => bu - m_y.exp(),
            MetalogBounds::Bounded(bl, bu) => {
                let e = m_y.exp();
                (bl + bu * e) / (1.0 + e)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::StdRng;
    use rand::SeedableRng;

    #[test]
    fn test_metalog_fit_and_sample() {
        // 1. Generate synthetic data (Standard Normal: Mean=0, Std=1)
        // We use quantile-based data points for fitting to be exact
        let data_y = vec![0.1, 0.3, 0.5, 0.7, 0.9];
        // Inverse CDF of Normal(0,1) for these quantiles approx:
        // 0.1 -> -1.28
        // 0.3 -> -0.52
        // 0.5 -> 0.0
        // 0.7 -> 0.52
        // 0.9 -> 1.28
        let data_x = vec![-1.28155, -0.5244, 0.0, 0.5244, 1.28155];

        // 2. Fit Metalog (Unbounded, 3 terms)
        let metalog = fit_metalog(&data_x, &data_y, 3, MetalogBounds::Unbounded).unwrap();
        
        println!("Coefficients: {:?}", metalog.coefficients);
        
        // Check if coefficients look reasonable
        // a1 (median) should be close to 0
        assert!((metalog.coefficients[0] - 0.0).abs() < 0.1); 
        // a2 (scale) should be positive
        assert!(metalog.coefficients[1] > 0.0);

        // 3. Sample
        let mut rng = StdRng::seed_from_u64(42);
        let sample = metalog.sample(&mut rng);
        println!("Sampled value: {}", sample);
        assert!(sample > -5.0 && sample < 5.0); // Broad sanity check
    }

    #[test]
    fn test_bounded_metalog() {
        // Data for Bounded [0, 100]
        let data_y = vec![0.5];
        let data_x = vec![50.0]; // Median is 50

        // Fit 2 terms
        let metalog = fit_metalog(
            &data_x, 
            &data_y, 
            2, 
            MetalogBounds::Bounded(0.0, 100.0)
        ).unwrap();

        let mut rng = StdRng::seed_from_u64(123);
        for _ in 0..10 {
            let s = metalog.sample(&mut rng);
            assert!(s >= 0.0 && s <= 100.0);
        }
    }
}
