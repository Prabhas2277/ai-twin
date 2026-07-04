package com.campus.common.multitenancy;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

/**
 * Base abstract class for tenant-scoped database entities.
 * Declares the tenant_id database column and registers the Hibernate filter.
 */
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = String.class)
)
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId"
)
public abstract class TenantAware {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private String tenantId;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    /**
     * Automatically sets the tenant_id field before persisting if not already set,
     * drawing from the current ThreadLocal TenantContext.
     */
    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            String currentTenant = TenantContext.getCurrentTenant();
            if (currentTenant != null) {
                this.tenantId = currentTenant;
            }
        }
    }
}
