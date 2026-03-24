import React from 'react';

export default function AboutSection() {
  const features = [
    {
      title: "Simulate Conditions",
      desc: "Run thousands of environmental impact scenarios instantly without risking livestocks or resources. Identify optimal interventions proactively through deterministic models.",
    },
    {
      title: "Batch Validation",
      desc: "Upload CSV batches containing historic telemetry or sensor arrays to backtest the structural integrity of predictive physical models against continuous datasets.",
    },
    {
      title: "Yield Optimization",
      desc: "Use advanced modeling to prescribe precise, step-wise adjustments to parameters like stocking density and pH levels to maximize biological yield over time.",
    }
  ];

  return (
    <div className="w-full py-8">
      <div className="border border-border bg-surface p-12 rounded-sm mb-12 flex flex-col lg:flex-row gap-12 items-start text-sm">
        <div className="lg:w-1/3">
          <h2 className="text-lg font-medium text-primary mb-2">
            The NORI Engine
          </h2>
          <p className="text-secondary leading-relaxed mt-4">
            NORI is a state-of-the-art Digital Twin & Decision Support Platform engineered for integrated aquaculture.
          </p>
        </div>
        <div className="lg:w-2/3">
          <p className="text-secondary leading-relaxed">
            By modeling complex non-linear interactions between shrimp and seaweed metabolisms alongside physical hydrodynamics, NORI enables academic and industrial researchers to safely simulate and predict biophysical outcomes. Build, test, and deploy operational configurations across an unbounded set of environmental states.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border bg-surface rounded-sm divide-y md:divide-y-0 md:divide-x divide-border">
        {features.map((feature, i) => (
          <div key={i} className="p-8 hover:bg-border/30 transition-colors duration-150">
            <h3 className="text-sm font-medium text-primary mb-4">
              {feature.title}
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-start">
        <button className="text-[11px] font-mono uppercase tracking-widest text-secondary hover:text-primary transition-colors">
          View Repository &rarr;
        </button>
      </div>
    </div>
  );
}
