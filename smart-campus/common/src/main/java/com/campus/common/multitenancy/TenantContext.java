package com.campus.common.multitenancy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ThreadLocal container for holding the current tenant context.
 * The tenant ID is set by a servlet filter/interceptor when a request begins,
 * accessed during database query compilation, and cleared when the request completes.
 */
public class TenantContext {

    private static final Logger logger = LoggerFactory.getLogger(TenantContext.class);
    
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) {
        if (logger.isDebugEnabled()) {
            logger.debug("Setting tenant context: {}", tenantId);
        }
        currentTenant.set(tenantId);
    }

    public static String getCurrentTenant() {
        return currentTenant.get();
    }

    public static void clear() {
        if (logger.isDebugEnabled()) {
            logger.debug("Clearing tenant context: {}", currentTenant.get());
        }
        currentTenant.remove();
    }
}
