//! Database repositories
//!
//! CRUD operations for each entity type.

pub mod assets;
pub mod geo;
pub mod person;

pub use assets::AssetRepository;
pub use geo::GeoRepository;
pub use person::PersonRepository;
