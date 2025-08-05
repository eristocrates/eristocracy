/**
 * Material & Shader Complexity Analyzer
 * Identifies expensive rendering features and optimization opportunities
 */
export class MaterialComplexityAnalyzer {
  constructor() {
    this.complexityWeights = {
      // Texture-based complexity
      map: 1,
      normalMap: 2,
      bumpMap: 1.5,
      envMap: 3,
      lightMap: 1.2,
      aoMap: 1.1,
      emissiveMap: 1.1,
      specularMap: 1.5,
      roughnessMap: 1.3,
      metalnessMap: 1.3,
      alphaMap: 2,
      displacementMap: 4,

      // Feature-based complexity
      transparent: 3,
      alphaTest: 2,
      wireframe: 0.5,
      flatShading: -0.5,
      vertexColors: 0.5,
      fog: 1,

      // Lighting complexity
      lights: 2,
      shadows: 4,

      // Advanced features
      morphTargets: 3,
      morphNormals: 2,
      skinning: 4,
      instancing: -2, // Reduces complexity per instance
    };

    this.materialTypes = {
      'MeshBasicMaterial': 1,
      'MeshLambertMaterial': 2,
      'MeshPhongMaterial': 3,
      'MeshStandardMaterial': 4,
      'MeshPhysicalMaterial': 5,
      'ShaderMaterial': 6,
      'RawShaderMaterial': 7
    };
  }

  /**
   * Analyze all materials in a scene
   */
  analyzeScene(scene) {
    const materials = new Map();
    const materialUsage = new Map();
    let totalComplexity = 0;
    let meshCount = 0;

    scene.traverse((object) => {
      if (object.isMesh && object.material) {
        meshCount++;
        const meshMaterials = Array.isArray(object.material) ?
          object.material : [object.material];

        meshMaterials.forEach(material => {
          const uuid = material.uuid;

          if (!materials.has(uuid)) {
            const analysis = this.analyzeMaterial(material);
            materials.set(uuid, analysis);
          }

          // Track usage
          const usage = materialUsage.get(uuid) || 0;
          materialUsage.set(uuid, usage + 1);

          totalComplexity += materials.get(uuid).complexity;
        });
      }
    });

    // Generate optimization report
    const optimizations = this.generateOptimizations(materials, materialUsage);

    return {
      totalMaterials: materials.size,
      totalMeshes: meshCount,
      averageComplexity: totalComplexity / meshCount,
      materials: Array.from(materials.entries()).map(([uuid, analysis]) => ({
        uuid,
        usage: materialUsage.get(uuid),
        ...analysis
      })),
      optimizations,
      summary: this.generateSummary(materials, materialUsage, totalComplexity, meshCount)
    };
  }

  /**
   * Analyze individual material complexity
   */
  analyzeMaterial(material) {
    let complexity = 0;
    const features = [];
    const expensiveFeatures = [];
    const optimizations = [];

    // Base material type complexity
    const typeName = material.constructor.name;
    const baseComplexity = this.materialTypes[typeName] || 3;
    complexity += baseComplexity;
    features.push(`Type: ${typeName} (${baseComplexity})`);

    // Texture analysis
    Object.keys(this.complexityWeights).forEach(property => {
      if (material[property] !== undefined && material[property] !== null) {
        const weight = this.complexityWeights[property];

        if (property.endsWith('Map') && material[property].isTexture) {
          const texture = material[property];
          const textureComplexity = this.analyzeTexture(texture, property);
          complexity += textureComplexity;
          features.push(`${property}: ${textureComplexity.toFixed(1)}`);

          if (textureComplexity > 2) {
            expensiveFeatures.push(`${property} (${textureComplexity.toFixed(1)})`);
          }
        } else if (typeof material[property] === 'boolean' && material[property]) {
          complexity += weight;
          features.push(`${property}: ${weight}`);

          if (weight > 2) {
            expensiveFeatures.push(`${property} (${weight})`);
          }
        } else if (typeof material[property] === 'number' && material[property] > 0) {
          complexity += weight * (material[property] / 10); // Scale numeric values
          features.push(`${property}: ${(weight * material[property] / 10).toFixed(1)}`);
        }
      }
    });

    // Generate specific optimizations
    if (material.transparent && !material.alphaTest) {
      optimizations.push('Consider using alphaTest instead of transparency if possible');
    }

    if (expensiveFeatures.length > 3) {
      optimizations.push('Consider reducing texture maps or using texture atlases');
    }

    if (material.envMap && !material.envMap.flipY) {
      optimizations.push('Ensure environment map is optimized for GPU');
    }

    // Shader analysis for custom materials
    let shaderComplexity = 0;
    if (material.isShaderMaterial || material.isRawShaderMaterial) {
      shaderComplexity = this.analyzeShader(material);
      complexity += shaderComplexity;
    }

    return {
      type: typeName,
      complexity: Math.round(complexity * 10) / 10,
      baseComplexity,
      features,
      expensiveFeatures,
      optimizations,
      shaderComplexity,
      rating: this.getComplexityRating(complexity)
    };
  }

  /**
   * Analyze texture complexity
   */
  analyzeTexture(texture, propertyName) {
    let complexity = this.complexityWeights[propertyName] || 1;

    // Size-based complexity
    if (texture.image) {
      const pixels = texture.image.width * texture.image.height;
      if (pixels > 1024 * 1024) complexity += 2; // > 1MP
      else if (pixels > 512 * 512) complexity += 1; // > 0.25MP
    }

    // Format-based complexity
    if (texture.format && texture.format !== THREE.RGBAFormat) {
      complexity += 0.5; // Non-standard formats
    }

    // Filtering complexity
    if (texture.minFilter === THREE.LinearMipmapLinearFilter) {
      complexity += 0.5; // Trilinear filtering
    }

    return complexity;
  }

  /**
   * Analyze shader complexity (basic heuristics)
   */
  analyzeShader(material) {
    let complexity = 0;

    if (material.vertexShader) {
      const vertexLines = material.vertexShader.split('\n').length;
      complexity += Math.min(vertexLines / 10, 5); // Cap at 5
    }

    if (material.fragmentShader) {
      const fragmentLines = material.fragmentShader.split('\n').length;
      complexity += Math.min(fragmentLines / 10, 10); // Cap at 10

      // Look for expensive operations
      const expensiveOps = ['texture2D', 'texture', 'normalize', 'reflect', 'sin', 'cos', 'pow'];
      expensiveOps.forEach(op => {
        const matches = (material.fragmentShader.match(new RegExp(op, 'g')) || []).length;
        complexity += matches * 0.2;
      });
    }

    return complexity;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizations(materials, materialUsage) {
    const optimizations = [];

    // Find duplicate materials
    const typeGroups = new Map();
    materials.forEach((analysis, uuid) => {
      const key = `${analysis.type}-${analysis.features.join(',')}`;
      if (!typeGroups.has(key)) {
        typeGroups.set(key, []);
      }
      typeGroups.get(key).push({ uuid, usage: materialUsage.get(uuid), ...analysis });
    });

    typeGroups.forEach((group, key) => {
      if (group.length > 1) {
        const totalUsage = group.reduce((sum, mat) => sum + mat.usage, 0);
        optimizations.push({
          type: 'material-consolidation',
          severity: 'medium',
          message: `${group.length} similar materials could be consolidated (${totalUsage} meshes affected)`,
          materials: group.map(m => m.uuid),
          impact: `Reduce material switches by ${group.length - 1}`
        });
      }
    });

    // Find high-complexity materials with high usage
    materials.forEach((analysis, uuid) => {
      const usage = materialUsage.get(uuid);
      if (analysis.complexity > 8 && usage > 5) {
        optimizations.push({
          type: 'high-impact-optimization',
          severity: 'high',
          message: `High complexity material used ${usage} times (complexity: ${analysis.complexity})`,
          material: uuid,
          suggestions: analysis.optimizations,
          impact: `Optimizing this material affects ${usage} meshes`
        });
      }
    });

    return optimizations;
  }

  /**
   * Generate analysis summary
   */
  generateSummary(materials, materialUsage, totalComplexity, meshCount) {
    const complexityDistribution = {
      low: 0,    // < 3
      medium: 0, // 3-6
      high: 0,   // 6-10
      extreme: 0 // > 10
    };

    materials.forEach((analysis) => {
      if (analysis.complexity < 3) complexityDistribution.low++;
      else if (analysis.complexity < 6) complexityDistribution.medium++;
      else if (analysis.complexity < 10) complexityDistribution.high++;
      else complexityDistribution.extreme++;
    });

    const averageComplexity = totalComplexity / meshCount;

    return {
      averageComplexity: Math.round(averageComplexity * 10) / 10,
      complexityDistribution,
      materialEfficiency: materials.size / meshCount, // Lower is better (more reuse)
      recommendation: this.getOverallRecommendation(averageComplexity, complexityDistribution, materials.size, meshCount)
    };
  }

  /**
   * Get complexity rating
   */
  getComplexityRating(complexity) {
    if (complexity < 3) return 'Low';
    if (complexity < 6) return 'Medium';
    if (complexity < 10) return 'High';
    return 'Extreme';
  }

  /**
   * Get overall recommendation
   */
  getOverallRecommendation(avgComplexity, distribution, materialCount, meshCount) {
    if (avgComplexity > 8) {
      return 'High complexity detected. Focus on reducing texture usage and material features.';
    }

    if (materialCount > meshCount * 0.8) {
      return 'Low material reuse. Consider consolidating similar materials.';
    }

    if (distribution.extreme > 0) {
      return 'Some extremely complex materials detected. Optimize highest complexity materials first.';
    }

    if (avgComplexity < 4 && distribution.high === 0) {
      return 'Good material optimization. Performance should be solid.';
    }

    return 'Moderate complexity. Consider optimizing high-usage materials.';
  }
} 