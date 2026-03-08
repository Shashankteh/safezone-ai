const mongoose = require('mongoose');

const safetyScoreSchema = new mongoose.Schema({
  gridKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  score: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  incidentCount: { type: Number, default: 0 },
  factors: {
    crimeRate:         { type: Number, default: 0, min: 0, max: 100 },
    lightingScore:     { type: Number, default: 50, min: 0, max: 100 },
    communityReports:  { type: Number, default: 0 },
    policeProximity:   { type: Number, default: 50, min: 0, max: 100 },
    populationDensity: { type: Number, default: 50, min: 0, max: 100 }
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Geo index for proximity queries
safetyScoreSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

// Static: Get or create grid cell for a coordinate
safetyScoreSchema.statics.getOrCreateGrid = async function(lat, lng) {
  const precision = 3; // ~111m grid cells
  const gridKey = `${lat.toFixed(precision)}_${lng.toFixed(precision)}`;

  let cell = await this.findOne({ gridKey });
  if (!cell) {
    cell = await this.create({
      gridKey,
      coordinates: { lat: parseFloat(lat.toFixed(precision)), lng: parseFloat(lng.toFixed(precision)) },
      score: 75,
      riskLevel: 'Low'
    });
  }
  return cell;
};

// Static: Recalculate score after new incident
safetyScoreSchema.statics.recalculateScore = async function(lat, lng, severity) {
  const cell = await this.getOrCreateGrid(lat, lng);

  // Severity penalty: 1=Low(-2), 2=Med(-5), 3=High(-10)
  const penalties = { 1: 2, 2: 5, 3: 10 };
  const penalty = penalties[severity] || 5;

  cell.score = Math.max(0, cell.score - penalty);
  cell.incidentCount += 1;
  cell.factors.crimeRate = Math.min(100, cell.factors.crimeRate + penalty);
  cell.riskLevel = cell.score >= 70 ? 'Low' : cell.score >= 40 ? 'Medium' : 'High';
  cell.lastUpdated = new Date();
  await cell.save();
  return cell;
};

module.exports = mongoose.model('SafetyScore', safetyScoreSchema);
