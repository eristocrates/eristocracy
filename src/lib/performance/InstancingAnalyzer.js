/**
 * Instancing Opportunity Analyzer
 * Identifies geometry+material combinations that could benefit from instanced rendering
 */
export class InstancingAnalyzer {
  constructor() {
    this.minInstanceThreshold = 3; // Minimum instances to recommend instancing
  }

  /**
   * Analyze scene for instancing opportunities
   */
  analyzeScene(scene) {
    const meshes = [];
    const instancedMeshes = [];
    const geometryGroups = new Map();
    const materialGroups = new Map();
    const combinationGroups = new Map();

    // Collect all meshes and group by geometry+material
    scene.traverse((object) => {
      if (object.isMesh) {
        if (object.isInstancedMesh) {
          instancedMeshes.push({
            object,
            instanceCount: object.count,
            geometry: object.geometry,
            material: object.material
          });
        } else {
          meshes.push(object);

          // Group by geometry
          const geomId = this.getGeometryId(object.geometry);
          if (!geometryGroups.has(geomId)) {
            geometryGroups.set(geomId, []);
          }
          geometryGroups.get(geomId).push(object);

          // Group by material
          const matId = this.getMaterialId(object.material);
          if (!materialGroups.has(matId)) {
            materialGroups.set(matId, []);
          }
          materialGroups.get(matId).push(object);

          // Group by geometry+material combination
          const comboId = `${geomId}:${matId}`;
          if (!combinationGroups.has(comboId)) {
            combinationGroups.set(comboId, {
              geometry: object.geometry,
              material: object.material,
              meshes: []
            });
          }
          combinationGroups.get(comboId).meshes.push(object);
        }
      }
    });

    // Analyze instancing opportunities
    const opportunities = this.findInstancingOpportunities(combinationGroups);
    const statistics = this.calculateStatistics(meshes, instancedMeshes, opportunities);
    const recommendations = this.generateRecommendations(opportunities, statistics);

    return {
      totalMeshes: meshes.length,
      totalInstancedMeshes: instancedMeshes.length,
      uniqueGeometries: geometryGroups.size,
      uniqueMaterials: materialGroups.size,
      uniqueCombinations: combinationGroups.size,
      instancingRatio: instancedMeshes.length / (meshes.length + instancedMeshes.length),
      opportunities,
      statistics,
      recommendations,
      potentialDrawCallReduction: this.calculateDrawCallReduction(opportunities)
    };
  }

  /**
   * Generate unique ID for geometry
   */
  getGeometryId(geometry) {
    if (!geometry) return 'null';

    // Use geometry UUID if available
    if (geometry.uuid) return geometry.uuid;

    // Fallback: create ID based on geometry properties
    const type = geometry.constructor.name;
    const vertexCount = geometry.attributes?.position?.count || 0;
    const indexCount = geometry.index?.count || 0;

    return `${type}-${vertexCount}-${indexCount}`;
  }

  /**
   * Generate unique ID for material
   */
  getMaterialId(material) {
    if (!material) return 'null';

    if (Array.isArray(material)) {
      return material.map(m => m.uuid || 'unknown').join('|');
    }

    return material.uuid || 'unknown';
  }

  /**
   * Find instancing opportunities
   */
  findInstancingOpportunities(combinationGroups) {
    const opportunities = [];

    combinationGroups.forEach((group, comboId) => {
      if (group.meshes.length >= this.minInstanceThreshold) {
        const geometryComplexity = this.analyzeGeometryComplexity(group.geometry);
        const materialComplexity = this.analyzeMaterialComplexity(group.material);

        const opportunity = {
          id: comboId,
          geometry: {
            type: group.geometry.constructor.name,
            vertices: group.geometry.attributes?.position?.count || 0,
            triangles: group.geometry.index ? group.geometry.index.count / 3 :
              (group.geometry.attributes?.position?.count || 0) / 3,
            complexity: geometryComplexity
          },
          material: {
            type: Array.isArray(group.material) ?
              group.material.map(m => m.constructor.name).join('+') :
              group.material.constructor.name,
            complexity: materialComplexity
          },
          instances: group.meshes.length,
          meshes: group.meshes.map(mesh => ({
            id: mesh.uuid,
            name: mesh.name || 'Unnamed',
            position: mesh.position.toArray(),
            rotation: mesh.rotation.toArray(),
            scale: mesh.scale.toArray(),
            visible: mesh.visible
          })),
          drawCallReduction: group.meshes.length - 1,
          priority: this.calculatePriority(group.meshes.length, geometryComplexity, materialComplexity),
          estimatedPerformanceGain: this.estimatePerformanceGain(group.meshes.length, geometryComplexity),
          implementation: this.generateImplementationSuggestion(group)
        };

        opportunities.push(opportunity);
      }
    });

    // Sort by priority (highest first)
    opportunities.sort((a, b) => b.priority - a.priority);

    return opportunities;
  }

  /**
   * Analyze geometry complexity
   */
  analyzeGeometryComplexity(geometry) {
    let complexity = 1;

    if (geometry.attributes?.position) {
      const vertexCount = geometry.attributes.position.count;
      if (vertexCount > 10000) complexity += 3;
      else if (vertexCount > 1000) complexity += 2;
      else if (vertexCount > 100) complexity += 1;
    }

    // Additional attributes increase complexity
    const attributeCount = Object.keys(geometry.attributes || {}).length;
    complexity += Math.min(attributeCount, 5);

    // Morph targets
    if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).length > 0) {
      complexity += 2;
    }

    return complexity;
  }

  /**
   * Analyze material complexity (simplified)
   */
  analyzeMaterialComplexity(material) {
    if (Array.isArray(material)) {
      return material.reduce((sum, mat) => sum + this.getSingleMaterialComplexity(mat), 0);
    }
    return this.getSingleMaterialComplexity(material);
  }

  getSingleMaterialComplexity(material) {
    const materialTypes = {
      'MeshBasicMaterial': 1,
      'MeshLambertMaterial': 2,
      'MeshPhongMaterial': 3,
      'MeshStandardMaterial': 4,
      'MeshPhysicalMaterial': 5,
      'ShaderMaterial': 6,
      'RawShaderMaterial': 7
    };

    return materialTypes[material.constructor.name] || 3;
  }

  /**
   * Calculate priority for instancing opportunity
   */
  calculatePriority(instanceCount, geometryComplexity, materialComplexity) {
    // Higher instance count = higher priority
    let priority = instanceCount * 10;

    // Higher complexity = higher priority (more performance gain)
    priority += (geometryComplexity + materialComplexity) * 5;

    // Bonus for large numbers of instances
    if (instanceCount > 10) priority += 50;
    if (instanceCount > 100) priority += 100;

    return Math.round(priority);
  }

  /**
   * Estimate performance gain from instancing
   */
  estimatePerformanceGain(instanceCount, geometryComplexity) {
    // Draw call reduction is the primary benefit
    const drawCallReduction = instanceCount - 1;

    // Performance gain scales with complexity and instance count
    const baseGain = drawCallReduction * 2; // 2ms per draw call saved (rough estimate)
    const complexityMultiplier = Math.min(geometryComplexity / 5, 2);

    return Math.round(baseGain * complexityMultiplier);
  }

  /**
   * Generate implementation suggestion
   */
  generateImplementationSuggestion(group) {
    const instanceCount = group.meshes.length;

    return {
      approach: 'InstancedMesh',
      steps: [
        `Create InstancedMesh with count: ${instanceCount}`,
        'Extract transformation matrices from existing meshes',
        'Set instance matrix attribute',
        'Remove original meshes from scene',
        'Add InstancedMesh to scene'
      ],
      codeExample: this.generateCodeExample(group),
      considerations: [
        'All instances must share the same geometry and material',
        'Individual instance visibility requires instanceMatrix updates',
        'Dynamic instance count changes require recreation',
        instanceCount > 1000 ? 'Consider frustum culling for large instance counts' : null
      ].filter(Boolean)
    };
  }

  /**
   * Generate code example for instancing
   */
  generateCodeExample(group) {
    const geometryType = group.geometry.constructor.name;
    const materialType = Array.isArray(group.material) ?
      'Material[]' : group.material.constructor.name;

    return `// Replace ${group.meshes.length} individual meshes with InstancedMesh
const instancedMesh = new THREE.InstancedMesh(geometry, material, ${group.meshes.length});

// Set transformation matrices
const matrix = new THREE.Matrix4();
meshes.forEach((mesh, index) => {
  matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
  instancedMesh.setMatrixAt(index, matrix);
});

instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);`;
  }

  /**
   * Calculate statistics
   */
  calculateStatistics(meshes, instancedMeshes, opportunities) {
    const totalDrawCallsCurrently = meshes.length + instancedMeshes.length;
    const potentialDrawCallsAfterInstancing = meshes.length -
      opportunities.reduce((sum, opp) => sum + opp.drawCallReduction, 0) +
      instancedMeshes.length;

    const totalInstances = instancedMeshes.reduce((sum, im) => sum + im.instanceCount, 0) +
      opportunities.reduce((sum, opp) => sum + opp.instances, 0);

    return {
      currentDrawCalls: totalDrawCallsCurrently,
      potentialDrawCalls: potentialDrawCallsAfterInstancing,
      drawCallReduction: totalDrawCallsCurrently - potentialDrawCallsAfterInstancing,
      reductionPercentage: Math.round(((totalDrawCallsCurrently - potentialDrawCallsAfterInstancing) / totalDrawCallsCurrently) * 100),
      totalInstancesAfterOptimization: totalInstances,
      instanceEfficiencyRatio: totalInstances / potentialDrawCallsAfterInstancing
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(opportunities, statistics) {
    const recommendations = [];

    if (opportunities.length === 0) {
      recommendations.push({
        type: 'no-opportunities',
        message: 'No instancing opportunities found. Consider using more repeated geometry.',
        priority: 'info'
      });
    } else {
      // Prioritize high-impact opportunities
      const highImpact = opportunities.filter(o => o.instances > 10);
      if (highImpact.length > 0) {
        recommendations.push({
          type: 'high-impact',
          message: `${highImpact.length} high-impact instancing opportunities (>10 instances each)`,
          opportunities: highImpact.map(o => o.id),
          priority: 'high'
        });
      }

      // Quick wins
      const quickWins = opportunities.filter(o => o.instances >= 5 && o.instances <= 10);
      if (quickWins.length > 0) {
        recommendations.push({
          type: 'quick-wins',
          message: `${quickWins.length} quick win opportunities (5-10 instances each)`,
          opportunities: quickWins.map(o => o.id),
          priority: 'medium'
        });
      }

      // Overall draw call reduction
      if (statistics.drawCallReduction > 10) {
        recommendations.push({
          type: 'significant-reduction',
          message: `Potential ${statistics.drawCallReduction} draw call reduction (${statistics.reductionPercentage}%)`,
          priority: 'high'
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate total potential draw call reduction
   */
  calculateDrawCallReduction(opportunities) {
    return opportunities.reduce((total, opp) => total + opp.drawCallReduction, 0);
  }
} 