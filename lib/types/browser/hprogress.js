$.extend(vrt.Api.Hprogress.prototype, vrt.Api.Vprogress.prototype);

vrt.Api.Hprogress.prototype.getGraph = function() {	
	return new RGraph.HProgress(this.id, Object.values(this.data), this.topBoundary);
};
